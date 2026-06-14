package cache

import (
	"context"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

// ArticleCache handles article caching
type ArticleCache struct {
	strategy       *Strategy
	redisTimeout   time.Duration
	articleTimeout time.Duration
}

// NewArticleCache creates a new article cache
func NewArticleCache(client *redis.Client, redisTimeout, articleTimeout time.Duration) *ArticleCache {
	return &ArticleCache{
		strategy:       NewStrategy(client),
		redisTimeout:   redisTimeout,
		articleTimeout: articleTimeout,
	}
}

// GetArticleBySlug retrieves cached article by slug
// ✅ SEC-010 FIX: Add timeout context
func (c *ArticleCache) GetArticleBySlug(slug string, dest interface{}) error {
	ctx, cancel := context.WithTimeout(context.Background(), c.redisTimeout)
	defer cancel()

	key := CacheKey(PrefixArticle, slug)
	return c.strategy.Get(ctx, key, dest)
}

// SetArticle caches an article
func (c *ArticleCache) SetArticle(slug string, article interface{}) error {
	ctx, cancel := context.WithTimeout(context.Background(), c.redisTimeout)
	defer cancel()

	key := CacheKey(PrefixArticle, slug)
	return c.strategy.Set(ctx, key, article, c.articleTimeout)
}

// DeleteArticle removes article from cache
func (c *ArticleCache) DeleteArticle(slug string) error {
	ctx, cancel := context.WithTimeout(context.Background(), c.redisTimeout)
	defer cancel()

	key := CacheKey(PrefixArticle, slug)
	return c.strategy.Delete(ctx, key)
}

// InvalidateArticleCache invalidates all article-related caches
func (c *ArticleCache) InvalidateArticleCache(slug string) error {
	ctx, cancel := context.WithTimeout(context.Background(), c.redisTimeout*2)
	defer cancel()

	// Delete article detail cache
	if err := c.DeleteArticle(slug); err != nil {
		return err
	}

	// Delete article list caches
	pattern := fmt.Sprintf("tzblog:%s:*", PrefixArticleList)
	return c.strategy.DeletePattern(ctx, pattern)
}

// GetViewCount gets article view count
func (c *ArticleCache) GetViewCount(articleID int64) (int64, error) {
	ctx, cancel := context.WithTimeout(context.Background(), c.redisTimeout)
	defer cancel()

	key := CacheKey(PrefixViewCount, articleID)
	count, err := c.strategy.client.Get(ctx, key).Int64()
	if err == redis.Nil {
		return 0, nil
	}
	return count, err
}

// IncrementViewCount increments article view count
func (c *ArticleCache) IncrementViewCount(articleID int64) (int64, error) {
	ctx, cancel := context.WithTimeout(context.Background(), c.redisTimeout)
	defer cancel()

	key := CacheKey(PrefixViewCount, articleID)
	count, err := c.strategy.Increment(ctx, key)
	if err != nil {
		return 0, err
	}

	// Set expiration if this is the first increment
	if count == 1 {
		_ = c.strategy.Expire(ctx, key, 24*time.Hour)
	}

	return count, nil
}

// GetLikeCount gets article like count
func (c *ArticleCache) GetLikeCount(articleID int64) (int64, error) {
	ctx, cancel := context.WithTimeout(context.Background(), c.redisTimeout)
	defer cancel()

	key := CacheKey(PrefixLikeCount, articleID)
	count, err := c.strategy.client.Get(ctx, key).Int64()
	if err == redis.Nil {
		return 0, nil
	}
	return count, err
}

// IncrementLikeCount increments article like count
func (c *ArticleCache) IncrementLikeCount(articleID int64) error {
	ctx, cancel := context.WithTimeout(context.Background(), c.redisTimeout)
	defer cancel()

	key := CacheKey(PrefixLikeCount, articleID)
	_, err := c.strategy.Increment(ctx, key)
	return err
}

// DecrementLikeCount decrements article like count
func (c *ArticleCache) DecrementLikeCount(articleID int64) error {
	ctx, cancel := context.WithTimeout(context.Background(), c.redisTimeout)
	defer cancel()

	key := CacheKey(PrefixLikeCount, articleID)
	return c.strategy.client.Decr(ctx, key).Err()
}
