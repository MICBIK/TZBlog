package cache

import (
	"context"
	"testing"
	"time"

	"github.com/alicebob/miniredis/v2"
	"github.com/redis/go-redis/v9"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func setupTestCache(t *testing.T) (*MultiLayerCache, *miniredis.Miniredis) {
	// Create mock Redis
	mr, err := miniredis.Run()
	require.NoError(t, err)

	// Create Redis client
	client := redis.NewClient(&redis.Options{
		Addr: mr.Addr(),
	})

	// Create multi-layer cache
	cache := NewMultiLayerCache(client, 100, 5*time.Minute, 10*time.Minute)

	return cache, mr
}

func TestMultiLayerCache_L1Hit(t *testing.T) {
	cache, mr := setupTestCache(t)
	defer mr.Close()

	ctx := context.Background()
	key := "test:key"
	value := map[string]string{"hello": "world"}

	// Set value
	err := cache.Set(ctx, key, value, 10*time.Minute)
	require.NoError(t, err)

	// Get value (should hit L1)
	var result map[string]string
	err = cache.Get(ctx, key, &result)
	require.NoError(t, err)
	assert.Equal(t, value, result)

	// Check stats
	stats := cache.GetStats()
	assert.Equal(t, int64(1), stats.L1Hits)
	assert.Equal(t, int64(0), stats.L1Misses)
	assert.Equal(t, int64(0), stats.L2Hits)
}

func TestMultiLayerCache_L2Hit(t *testing.T) {
	cache, mr := setupTestCache(t)
	defer mr.Close()

	ctx := context.Background()
	key := "test:key"
	value := map[string]string{"hello": "world"}

	// Set value
	err := cache.Set(ctx, key, value, 10*time.Minute)
	require.NoError(t, err)

	// Clear L1 to force L2 lookup
	cache.l1.Clear()

	// Get value (should hit L2)
	var result map[string]string
	err = cache.Get(ctx, key, &result)
	require.NoError(t, err)
	assert.Equal(t, value, result)

	// Check stats
	stats := cache.GetStats()
	assert.Equal(t, int64(0), stats.L1Hits)
	assert.Equal(t, int64(1), stats.L1Misses)
	assert.Equal(t, int64(1), stats.L2Hits)
}

func TestMultiLayerCache_CacheMiss(t *testing.T) {
	cache, mr := setupTestCache(t)
	defer mr.Close()

	ctx := context.Background()
	key := "nonexistent:key"

	var result map[string]string
	err := cache.Get(ctx, key, &result)
	assert.ErrorIs(t, err, ErrCacheMiss)

	// Check stats
	stats := cache.GetStats()
	assert.Equal(t, int64(0), stats.L1Hits)
	assert.Equal(t, int64(1), stats.L1Misses)
	assert.Equal(t, int64(0), stats.L2Hits)
	assert.Equal(t, int64(1), stats.L2Misses)
}

func TestMultiLayerCache_Delete(t *testing.T) {
	cache, mr := setupTestCache(t)
	defer mr.Close()

	ctx := context.Background()
	key := "test:key"
	value := map[string]string{"hello": "world"}

	// Set value
	err := cache.Set(ctx, key, value, 10*time.Minute)
	require.NoError(t, err)

	// Delete value
	err = cache.Delete(ctx, key)
	require.NoError(t, err)

	// Try to get (should miss)
	var result map[string]string
	err = cache.Get(ctx, key, &result)
	assert.ErrorIs(t, err, ErrCacheMiss)
}

func TestMultiLayerCache_DeletePattern(t *testing.T) {
	cache, mr := setupTestCache(t)
	defer mr.Close()

	ctx := context.Background()

	// Set multiple values
	values := map[string]string{
		"test:key1": "value1",
		"test:key2": "value2",
		"test:key3": "value3",
		"other:key": "other",
	}

	for key, val := range values {
		err := cache.Set(ctx, key, val, 10*time.Minute)
		require.NoError(t, err)
	}

	// Delete pattern
	err := cache.DeletePattern(ctx, "test:*")
	require.NoError(t, err)

	// test:* keys should be gone
	var result string
	err = cache.Get(ctx, "test:key1", &result)
	assert.ErrorIs(t, err, ErrCacheMiss)

	// other:key should still exist
	err = cache.Get(ctx, "other:key", &result)
	require.NoError(t, err)
	assert.Equal(t, "other", result)
}

func TestL1Cache_Expiration(t *testing.T) {
	l1 := &L1Cache{maxSize: 10}

	key := "test:key"
	value := "test value"

	// Set with short TTL
	l1.Set(key, value, 100*time.Millisecond)

	// Should exist immediately
	val, ok := l1.Get(key)
	assert.True(t, ok)
	assert.Equal(t, value, val)

	// Wait for expiration
	time.Sleep(150 * time.Millisecond)

	// Should be expired
	_, ok = l1.Get(key)
	assert.False(t, ok)
}

func TestL1Cache_MaxSize(t *testing.T) {
	l1 := &L1Cache{maxSize: 3}

	// Add 3 items
	for i := 0; i < 3; i++ {
		l1.Set(string(rune('a'+i)), i, 1*time.Minute)
	}

	assert.Equal(t, 3, l1.Size())

	// Try to add 4th item (should be rejected)
	l1.Set("d", 4, 1*time.Minute)
	assert.Equal(t, 3, l1.Size())

	// Verify 4th item not added
	_, ok := l1.Get("d")
	assert.False(t, ok)
}

func TestMultiLayerCache_HitRates(t *testing.T) {
	cache, mr := setupTestCache(t)
	defer mr.Close()

	ctx := context.Background()

	// Set some values
	for i := 0; i < 10; i++ {
		key := string(rune('a' + i))
		err := cache.Set(ctx, key, i, 10*time.Minute)
		require.NoError(t, err)
	}

	// Get values multiple times (should hit L1)
	for i := 0; i < 10; i++ {
		key := string(rune('a' + i))
		var result int
		err := cache.Get(ctx, key, &result)
		require.NoError(t, err)
	}

	stats := cache.GetStats()
	assert.Equal(t, 1.0, stats.L1HitRate)
	assert.Equal(t, 1.0, stats.OverallHitRate)

	// Clear L1 and get again (should hit L2)
	cache.l1.Clear()
	for i := 0; i < 10; i++ {
		key := string(rune('a' + i))
		var result int
		err := cache.Get(ctx, key, &result)
		require.NoError(t, err)
	}

	stats = cache.GetStats()
	assert.Equal(t, float64(10)/float64(20), stats.L1HitRate) // 10 L1 hits out of 20 total
	assert.Equal(t, 1.0, stats.L2HitRate)                      // All L2 lookups hit
}

func TestMultiLayerCache_Warmup(t *testing.T) {
	cache, mr := setupTestCache(t)
	defer mr.Close()

	ctx := context.Background()
	warmupCalled := false

	// Set warmup function
	cache.SetWarmupFunc(func(ctx context.Context) error {
		warmupCalled = true
		// Preload some data
		return cache.Set(ctx, "hot:key", "hot value", 10*time.Minute)
	})

	// Execute warmup
	err := cache.Warmup(ctx)
	require.NoError(t, err)
	assert.True(t, warmupCalled)

	// Verify data was loaded
	var result string
	err = cache.Get(ctx, "hot:key", &result)
	require.NoError(t, err)
	assert.Equal(t, "hot value", result)
}

func BenchmarkMultiLayerCache_L1Hit(b *testing.B) {
	cache, mr := setupTestCache(&testing.T{})
	defer mr.Close()

	ctx := context.Background()
	key := "benchmark:key"
	value := map[string]string{"data": "value"}

	cache.Set(ctx, key, value, 10*time.Minute)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		var result map[string]string
		_ = cache.Get(ctx, key, &result)
	}
}

func BenchmarkMultiLayerCache_L2Hit(b *testing.B) {
	cache, mr := setupTestCache(&testing.T{})
	defer mr.Close()

	ctx := context.Background()
	key := "benchmark:key"
	value := map[string]string{"data": "value"}

	cache.Set(ctx, key, value, 10*time.Minute)
	cache.l1.Clear()

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		var result map[string]string
		_ = cache.Get(ctx, key, &result)
		cache.l1.Clear() // Clear L1 to force L2 lookup each time
	}
}
