package cache

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"sync"
	"time"

	"github.com/redis/go-redis/v9"
)

// MultiLayerCache implements a two-tier caching strategy
// L1: In-memory cache (fast, limited size)
// L2: Redis cache (slower, larger capacity)
type MultiLayerCache struct {
	l1        *L1Cache
	l2        *redis.Client
	stats     *CacheStats
	warmupFn  func(ctx context.Context) error
	mu        sync.RWMutex
	l1TTL     time.Duration
	l1MaxTTL  time.Duration
}

// L1Cache is an in-memory cache with TTL support
type L1Cache struct {
	data      sync.Map
	maxSize   int
	itemCount int
	mu        sync.RWMutex
}

// L1Item represents a cached item with expiration
type L1Item struct {
	Value     interface{}
	ExpiresAt time.Time
}

// CacheStats tracks cache performance metrics
type CacheStats struct {
	L1Hits   int64
	L1Misses int64
	L2Hits   int64
	L2Misses int64
	mu       sync.RWMutex
}

// NewMultiLayerCache creates a new multi-layer cache
func NewMultiLayerCache(redisClient *redis.Client, l1MaxSize int, l1TTL, l1MaxTTL time.Duration) *MultiLayerCache {
	return &MultiLayerCache{
		l1: &L1Cache{
			maxSize: l1MaxSize,
		},
		l2:       redisClient,
		stats:    &CacheStats{},
		l1TTL:    l1TTL,
		l1MaxTTL: l1MaxTTL,
	}
}

// Get retrieves data from cache (L1 -> L2 -> nil)
func (m *MultiLayerCache) Get(ctx context.Context, key string, dest interface{}) error {
	// Try L1 first
	if val, ok := m.l1.Get(key); ok {
		m.stats.IncrementL1Hits()

		// Type assertion and copy to dest
		data, err := json.Marshal(val)
		if err != nil {
			return err
		}
		return json.Unmarshal(data, dest)
	}

	m.stats.IncrementL1Misses()

	// Try L2 (Redis)
	data, err := m.l2.Get(ctx, key).Bytes()
	if err == redis.Nil {
		m.stats.IncrementL2Misses()
		return ErrCacheMiss
	}
	if err != nil {
		return fmt.Errorf("redis get failed: %w", err)
	}

	m.stats.IncrementL2Hits()

	// Unmarshal to dest
	if err := json.Unmarshal(data, dest); err != nil {
		return err
	}

	// Populate L1 cache
	var val interface{}
	if err := json.Unmarshal(data, &val); err == nil {
		m.l1.Set(key, val, m.l1TTL) // Use configured L1 TTL
	}

	return nil
}

// Set stores data in both L1 and L2 caches
func (m *MultiLayerCache) Set(ctx context.Context, key string, value interface{}, l2TTL time.Duration) error {
	// Marshal value
	data, err := json.Marshal(value)
	if err != nil {
		return err
	}

	// Set in L2 (Redis) with longer TTL
	if err := m.l2.Set(ctx, key, data, l2TTL).Err(); err != nil {
		return fmt.Errorf("redis set failed: %w", err)
	}

	// Set in L1 with shorter TTL (1/2 of L2 TTL)
	l1TTL := l2TTL / 2
	if l1TTL > m.l1MaxTTL {
		l1TTL = m.l1MaxTTL // Cap L1 TTL at configured max
	}
	m.l1.Set(key, value, l1TTL)

	return nil
}

// Delete removes data from both L1 and L2 caches
func (m *MultiLayerCache) Delete(ctx context.Context, key string) error {
	m.l1.Delete(key)
	return m.l2.Del(ctx, key).Err()
}

// DeletePattern removes all keys matching pattern from both caches
func (m *MultiLayerCache) DeletePattern(ctx context.Context, pattern string) error {
	// Clear L1 (simple approach: clear all since we don't support pattern matching)
	m.l1.Clear()

	// Clear L2 using SCAN
	var cursor uint64
	const batchSize = 1000

	for {
		keys, nextCursor, err := m.l2.Scan(ctx, cursor, pattern, batchSize).Result()
		if err != nil {
			return fmt.Errorf("scan failed: %w", err)
		}

		if len(keys) > 0 {
			if err := m.l2.Del(ctx, keys...).Err(); err != nil {
				return fmt.Errorf("delete batch failed: %w", err)
			}
		}

		cursor = nextCursor
		if cursor == 0 {
			break
		}
	}

	return nil
}

// Warmup preloads hot data into cache
func (m *MultiLayerCache) Warmup(ctx context.Context) error {
	if m.warmupFn == nil {
		return nil
	}
	return m.warmupFn(ctx)
}

// SetWarmupFunc sets the warmup function
func (m *MultiLayerCache) SetWarmupFunc(fn func(ctx context.Context) error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.warmupFn = fn
}

// GetStats returns current cache statistics
func (m *MultiLayerCache) GetStats() CacheStatsSnapshot {
	return m.stats.Snapshot()
}

// ResetStats resets cache statistics
func (m *MultiLayerCache) ResetStats() {
	m.stats.Reset()
}

// L1Cache methods

// Get retrieves an item from L1 cache
func (l *L1Cache) Get(key string) (interface{}, bool) {
	val, ok := l.data.Load(key)
	if !ok {
		return nil, false
	}

	item := val.(*L1Item)

	// Check expiration
	if time.Now().After(item.ExpiresAt) {
		l.data.Delete(key)
		l.mu.Lock()
		l.itemCount--
		l.mu.Unlock()
		return nil, false
	}

	return item.Value, true
}

// Set stores an item in L1 cache
func (l *L1Cache) Set(key string, value interface{}, ttl time.Duration) {
	l.mu.Lock()
	defer l.mu.Unlock()

	// Check size limit
	if l.itemCount >= l.maxSize {
		// Simple eviction: don't add if full
		// In production, use LRU or similar
		return
	}

	item := &L1Item{
		Value:     value,
		ExpiresAt: time.Now().Add(ttl),
	}

	_, loaded := l.data.LoadOrStore(key, item)
	if !loaded {
		l.itemCount++
	}
}

// Delete removes an item from L1 cache
func (l *L1Cache) Delete(key string) {
	if _, ok := l.data.LoadAndDelete(key); ok {
		l.mu.Lock()
		l.itemCount--
		l.mu.Unlock()
	}
}

// Clear removes all items from L1 cache
func (l *L1Cache) Clear() {
	l.data.Range(func(key, value interface{}) bool {
		l.data.Delete(key)
		return true
	})

	l.mu.Lock()
	l.itemCount = 0
	l.mu.Unlock()
}

// Size returns the number of items in L1 cache
func (l *L1Cache) Size() int {
	l.mu.RLock()
	defer l.mu.RUnlock()
	return l.itemCount
}

// CacheStats methods

// IncrementL1Hits increments L1 hit counter
func (s *CacheStats) IncrementL1Hits() {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.L1Hits++
}

// IncrementL1Misses increments L1 miss counter
func (s *CacheStats) IncrementL1Misses() {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.L1Misses++
}

// IncrementL2Hits increments L2 hit counter
func (s *CacheStats) IncrementL2Hits() {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.L2Hits++
}

// IncrementL2Misses increments L2 miss counter
func (s *CacheStats) IncrementL2Misses() {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.L2Misses++
}

// CacheStatsSnapshot represents a snapshot of cache statistics
type CacheStatsSnapshot struct {
	L1Hits       int64
	L1Misses     int64
	L2Hits       int64
	L2Misses     int64
	L1HitRate    float64
	L2HitRate    float64
	OverallHitRate float64
}

// Snapshot returns a snapshot of current statistics
func (s *CacheStats) Snapshot() CacheStatsSnapshot {
	s.mu.RLock()
	defer s.mu.RUnlock()

	snapshot := CacheStatsSnapshot{
		L1Hits:   s.L1Hits,
		L1Misses: s.L1Misses,
		L2Hits:   s.L2Hits,
		L2Misses: s.L2Misses,
	}

	// Calculate hit rates
	l1Total := s.L1Hits + s.L1Misses
	if l1Total > 0 {
		snapshot.L1HitRate = float64(s.L1Hits) / float64(l1Total)
	}

	l2Total := s.L2Hits + s.L2Misses
	if l2Total > 0 {
		snapshot.L2HitRate = float64(s.L2Hits) / float64(l2Total)
	}

	totalHits := s.L1Hits + s.L2Hits
	totalRequests := l1Total
	if totalRequests > 0 {
		snapshot.OverallHitRate = float64(totalHits) / float64(totalRequests)
	}

	return snapshot
}

// Reset resets all statistics
func (s *CacheStats) Reset() {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.L1Hits = 0
	s.L1Misses = 0
	s.L2Hits = 0
	s.L2Misses = 0
}

// Errors
var (
	ErrCacheMiss = errors.New("cache miss")
)
