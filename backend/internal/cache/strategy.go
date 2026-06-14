package cache

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

// Strategy defines cache strategy
type Strategy struct {
	client *redis.Client
}

// NewStrategy creates a new cache strategy
func NewStrategy(client *redis.Client) *Strategy {
	return &Strategy{
		client: client,
	}
}

// CacheKey generates cache key with prefix
func CacheKey(prefix string, id interface{}) string {
	return fmt.Sprintf("tzblog:%s:%v", prefix, id)
}

// Get retrieves cached data
func (s *Strategy) Get(ctx context.Context, key string, dest interface{}) error {
	data, err := s.client.Get(ctx, key).Bytes()
	if err != nil {
		return err
	}

	return json.Unmarshal(data, dest)
}

// Set stores data in cache
func (s *Strategy) Set(ctx context.Context, key string, value interface{}, expiration time.Duration) error {
	data, err := json.Marshal(value)
	if err != nil {
		return err
	}

	return s.client.Set(ctx, key, data, expiration).Err()
}

// Delete removes cached data
func (s *Strategy) Delete(ctx context.Context, key string) error {
	return s.client.Del(ctx, key).Err()
}

// DeletePattern deletes keys matching pattern with batch optimization
func (s *Strategy) DeletePattern(ctx context.Context, pattern string) error {
	var cursor uint64
	const batchSize = 1000

	for {
		keys, nextCursor, err := s.client.Scan(ctx, cursor, pattern, batchSize).Result()
		if err != nil {
			return fmt.Errorf("scan failed at cursor %d: %w", cursor, err)
		}

		if len(keys) > 0 {
			// Batch delete
			if err := s.client.Del(ctx, keys...).Err(); err != nil {
				// Log error but continue cleanup
				fmt.Printf("delete batch failed: %v, keys: %v\n", err, keys)
			}
		}

		cursor = nextCursor
		if cursor == 0 {
			break
		}
	}
	return nil
}

// Increment increments a counter
func (s *Strategy) Increment(ctx context.Context, key string) (int64, error) {
	return s.client.Incr(ctx, key).Result()
}

// Expire sets expiration on existing key
func (s *Strategy) Expire(ctx context.Context, key string, expiration time.Duration) error {
	return s.client.Expire(ctx, key, expiration).Err()
}

// Cache durations
const (
	CacheArticleDetail    = 10 * time.Minute
	CacheArticleList      = 5 * time.Minute
	CacheUserProfile      = 15 * time.Minute
	CacheStats            = 5 * time.Minute
	CacheTags             = 30 * time.Minute
	CacheCategories       = 30 * time.Minute
	CachePopularArticles  = 1 * time.Hour
	CacheSitemap          = 24 * time.Hour
)

// Cache key prefixes
const (
	PrefixArticle         = "article"
	PrefixArticleList     = "article:list"
	PrefixUser            = "user"
	PrefixStats           = "stats"
	PrefixTag             = "tag"
	PrefixCategory        = "category"
	PrefixPopular         = "popular"
	PrefixSitemap         = "sitemap"
	PrefixViewCount       = "view_count"
	PrefixLikeCount       = "like_count"
)
