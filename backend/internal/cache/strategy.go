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
	ctx    context.Context
}

// NewStrategy creates a new cache strategy
func NewStrategy(client *redis.Client) *Strategy {
	return &Strategy{
		client: client,
		ctx:    context.Background(),
	}
}

// CacheKey generates cache key with prefix
func CacheKey(prefix string, id interface{}) string {
	return fmt.Sprintf("tzblog:%s:%v", prefix, id)
}

// Get retrieves cached data
func (s *Strategy) Get(key string, dest interface{}) error {
	data, err := s.client.Get(s.ctx, key).Bytes()
	if err != nil {
		return err
	}

	return json.Unmarshal(data, dest)
}

// Set stores data in cache
func (s *Strategy) Set(key string, value interface{}, expiration time.Duration) error {
	data, err := json.Marshal(value)
	if err != nil {
		return err
	}

	return s.client.Set(s.ctx, key, data, expiration).Err()
}

// Delete removes cached data
func (s *Strategy) Delete(key string) error {
	return s.client.Del(s.ctx, key).Err()
}

// DeletePattern deletes keys matching pattern
func (s *Strategy) DeletePattern(pattern string) error {
	iter := s.client.Scan(s.ctx, 0, pattern, 0).Iterator()
	for iter.Next(s.ctx) {
		if err := s.client.Del(s.ctx, iter.Val()).Err(); err != nil {
			return err
		}
	}
	return iter.Err()
}

// Increment increments a counter
func (s *Strategy) Increment(key string) (int64, error) {
	return s.client.Incr(s.ctx, key).Result()
}

// Expire sets expiration on existing key
func (s *Strategy) Expire(key string, expiration time.Duration) error {
	return s.client.Expire(s.ctx, key, expiration).Err()
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
