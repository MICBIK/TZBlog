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
	ctx      context.Context
}

// NewArticleCache creates a new article cache
func NewArticleCache(client *redis.Client) *ArticleCache {
	return &ArticleCache{
		strategy: NewStrategy(client),
		ctx:      context.Background(),
	}
}

// GetArticleBySlug retrieves cached article by slug
func (c *ArticleCache) GetArticleBySlug(slug string, dest interface{}) error {
	key := CacheKey(PrefixArticle, slug)
	return c.strategy.Get(key, dest)
}

// SetArticle caches an article
func (c *ArticleCache) SetArticle(slug string, article interface{}) error {
	key := CacheKey(PrefixArticle, slug)
	return c.strategy.Set(key, article, CacheArticleDetail)
}

// DeleteArticle removes article from cache
func (c *ArticleCache) DeleteArticle(slug string) error {
	key := CacheKey(PrefixArticle, slug)
	return c.strategy.Delete(key)
}

// InvalidateArticleCache invalidates all article-related caches
func (c *ArticleCache) InvalidateArticleCache(slug string) error {
	// Delete article detail cache
	if err := c.DeleteArticle(slug); err != nil {
		return err
	}

	// Delete article list caches
	pattern := fmt.Sprintf("tzblog:%s:*", PrefixArticleList)
	return c.strategy.DeletePattern(pattern)
}

// GetViewCount gets article view count
func (c *ArticleCache) GetViewCount(articleID int64) (int64, error) {
	key := CacheKey(PrefixViewCount, articleID)
	count, err := c.strategy.client.Get(c.ctx, key).Int64()
	if err == redis.Nil {
		return 0, nil
	}
	return count, err
}

// IncrementViewCount increments article view count
func (c *ArticleCache) IncrementViewCount(articleID int64) (int64, error) {
	key := CacheKey(PrefixViewCount, articleID)
	count, err := c.strategy.Increment(key)
	if err != nil {
		return 0, err
	}

	// Set expiration if this is the first increment
	if count == 1 {
		_ = c.strategy.Expire(key, 24*time.Hour)
	}

	return count, nil
}

// GetLikeCount gets article like count
func (c *ArticleCache) GetLikeCount(articleID int64) (int64, error) {
	key := CacheKey(PrefixLikeCount, articleID)
	count, err := c.strategy.client.Get(c.ctx, key).Int64()
	if err == redis.Nil {
		return 0, nil
	}
	return count, err
}

// IncrementLikeCount increments article like count
func (c *ArticleCache) IncrementLikeCount(articleID int64) error {
	key := CacheKey(PrefixLikeCount, articleID)
	_, err := c.strategy.Increment(key)
	return err
}

// DecrementLikeCount decrements article like count
func (c *ArticleCache) DecrementLikeCount(articleID int64) error {
	key := CacheKey(PrefixLikeCount, articleID)
	return c.strategy.client.Decr(c.ctx, key).Err()
}
