package cache

import (
	"context"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

// ArticleCache handles article caching
type ArticleCache struct {
	strategy *Strategy
}

// NewArticleCache creates a new article cache
func NewArticleCache(client *redis.Client) *ArticleCache {
	return &ArticleCache{
		strategy: NewStrategy(client),
	}
}

// GetArticleBySlug retrieves cached article by slug
func (c *ArticleCache) GetArticleBySlug(ctx context.Context, slug string, dest interface{}) error {
	key := CacheKey(PrefixArticle, slug)
	return c.strategy.Get(ctx, key, dest)
}

// SetArticle caches an article
func (c *ArticleCache) SetArticle(ctx context.Context, slug string, article interface{}) error {
	key := CacheKey(PrefixArticle, slug)
	return c.strategy.Set(ctx, key, article, CacheArticleDetail)
}

// DeleteArticle removes article from cache
func (c *ArticleCache) DeleteArticle(ctx context.Context, slug string) error {
	key := CacheKey(PrefixArticle, slug)
	return c.strategy.Delete(ctx, key)
}

// InvalidateArticleCache invalidates all article-related caches
func (c *ArticleCache) InvalidateArticleCache(ctx context.Context, slug string) error {
	// Delete article detail cache
	if err := c.DeleteArticle(ctx, slug); err != nil {
		return err
	}

	// Delete article list caches
	pattern := fmt.Sprintf("tzblog:%s:*", PrefixArticleList)
	return c.strategy.DeletePattern(ctx, pattern)
}

// GetViewCount gets article view count
func (c *ArticleCache) GetViewCount(ctx context.Context, articleID int64) (int64, error) {
	key := CacheKey(PrefixViewCount, articleID)
	count, err := c.strategy.client.Get(ctx, key).Int64()
	if err == redis.Nil {
		return 0, nil
	}
	return count, err
}

// IncrementViewCount increments article view count
func (c *ArticleCache) IncrementViewCount(ctx context.Context, articleID int64) (int64, error) {
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
func (c *ArticleCache) GetLikeCount(ctx context.Context, articleID int64) (int64, error) {
	key := CacheKey(PrefixLikeCount, articleID)
	count, err := c.strategy.client.Get(ctx, key).Int64()
	if err == redis.Nil {
		return 0, nil
	}
	return count, err
}

// IncrementLikeCount increments article like count
func (c *ArticleCache) IncrementLikeCount(ctx context.Context, articleID int64) error {
	key := CacheKey(PrefixLikeCount, articleID)
	_, err := c.strategy.Increment(ctx, key)
	return err
}

// DecrementLikeCount decrements article like count
func (c *ArticleCache) DecrementLikeCount(ctx context.Context, articleID int64) error {
	key := CacheKey(PrefixLikeCount, articleID)
	return c.strategy.client.Decr(ctx, key).Err()
}
