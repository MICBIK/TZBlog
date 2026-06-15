package cache

import (
	"context"
	"fmt"
	"time"

	"github.com/MICBIK/TZBlog/backend/pkg/logger"
	"go.uber.org/zap"
)

// CacheWarmer handles cache warming strategies
type CacheWarmer struct {
	cache      *MultiLayerCache
	strategies []WarmupStrategy
}

// WarmupStrategy defines a cache warmup strategy
type WarmupStrategy interface {
	Name() string
	Warmup(ctx context.Context, cache *MultiLayerCache) error
	Priority() int // Higher priority runs first
}

// NewCacheWarmer creates a new cache warmer
func NewCacheWarmer(cache *MultiLayerCache) *CacheWarmer {
	return &CacheWarmer{
		cache:      cache,
		strategies: make([]WarmupStrategy, 0),
	}
}

// RegisterStrategy registers a warmup strategy
func (w *CacheWarmer) RegisterStrategy(strategy WarmupStrategy) {
	w.strategies = append(w.strategies, strategy)
}

// WarmupAll executes all registered warmup strategies
func (w *CacheWarmer) WarmupAll(ctx context.Context) error {
	if len(w.strategies) == 0 {
		logger.Info("No warmup strategies registered")
		return nil
	}

	logger.Info("Starting cache warmup", zap.Int("strategies", len(w.strategies)))
	start := time.Now()

	// Sort strategies by priority (descending)
	sortedStrategies := w.sortStrategiesByPriority()

	successCount := 0
	for _, strategy := range sortedStrategies {
		strategyStart := time.Now()
		logger.Info("Running warmup strategy", zap.String("strategy", strategy.Name()))

		if err := strategy.Warmup(ctx, w.cache); err != nil {
			logger.Error("Warmup strategy failed",
				zap.String("strategy", strategy.Name()),
				zap.Error(err))
			// Continue with other strategies
			continue
		}

		successCount++
		logger.Info("Warmup strategy completed",
			zap.String("strategy", strategy.Name()),
			zap.Duration("duration", time.Since(strategyStart)))
	}

	logger.Info("Cache warmup completed",
		zap.Int("success", successCount),
		zap.Int("total", len(w.strategies)),
		zap.Duration("total_duration", time.Since(start)))

	return nil
}

// sortStrategiesByPriority sorts strategies by priority (descending)
func (w *CacheWarmer) sortStrategiesByPriority() []WarmupStrategy {
	sorted := make([]WarmupStrategy, len(w.strategies))
	copy(sorted, w.strategies)

	// Simple bubble sort (fine for small number of strategies)
	for i := 0; i < len(sorted); i++ {
		for j := i + 1; j < len(sorted); j++ {
			if sorted[j].Priority() > sorted[i].Priority() {
				sorted[i], sorted[j] = sorted[j], sorted[i]
			}
		}
	}

	return sorted
}

// PopularArticlesWarmupStrategy warms up popular articles
type PopularArticlesWarmupStrategy struct {
	fetcher PopularArticlesFetcher
}

// PopularArticlesFetcher fetches popular articles
type PopularArticlesFetcher interface {
	FetchPopularArticles(ctx context.Context, limit int) ([]ArticleCacheData, error)
}

// ArticleCacheData represents cached article data
type ArticleCacheData struct {
	ID      int64
	Slug    string
	Title   string
	Content string
	Author  interface{}
	Tags    interface{}
}

// NewPopularArticlesWarmupStrategy creates a new popular articles warmup strategy
func NewPopularArticlesWarmupStrategy(fetcher PopularArticlesFetcher) *PopularArticlesWarmupStrategy {
	return &PopularArticlesWarmupStrategy{
		fetcher: fetcher,
	}
}

func (s *PopularArticlesWarmupStrategy) Name() string {
	return "popular_articles"
}

func (s *PopularArticlesWarmupStrategy) Priority() int {
	return 100 // High priority
}

func (s *PopularArticlesWarmupStrategy) Warmup(ctx context.Context, cache *MultiLayerCache) error {
	articles, err := s.fetcher.FetchPopularArticles(ctx, 50) // Top 50 articles
	if err != nil {
		return fmt.Errorf("failed to fetch popular articles: %w", err)
	}

	for _, article := range articles {
		key := CacheKey(PrefixArticle, article.Slug)
		if err := cache.Set(ctx, key, article, CacheArticleDetail); err != nil {
			logger.Warn("Failed to warm article cache",
				zap.String("slug", article.Slug),
				zap.Error(err))
			// Continue with other articles
		}
	}

	logger.Info("Warmed popular articles", zap.Int("count", len(articles)))
	return nil
}

// TagsWarmupStrategy warms up tags
type TagsWarmupStrategy struct {
	fetcher TagsFetcher
}

// TagsFetcher fetches tags
type TagsFetcher interface {
	FetchAllTags(ctx context.Context) ([]TagCacheData, error)
}

// TagCacheData represents cached tag data
type TagCacheData struct {
	ID    int64
	Name  string
	Slug  string
	Count int64
}

// NewTagsWarmupStrategy creates a new tags warmup strategy
func NewTagsWarmupStrategy(fetcher TagsFetcher) *TagsWarmupStrategy {
	return &TagsWarmupStrategy{
		fetcher: fetcher,
	}
}

func (s *TagsWarmupStrategy) Name() string {
	return "tags"
}

func (s *TagsWarmupStrategy) Priority() int {
	return 90
}

func (s *TagsWarmupStrategy) Warmup(ctx context.Context, cache *MultiLayerCache) error {
	tags, err := s.fetcher.FetchAllTags(ctx)
	if err != nil {
		return fmt.Errorf("failed to fetch tags: %w", err)
	}

	// Cache all tags as a single entry
	key := CacheKey(PrefixTag, "all")
	if err := cache.Set(ctx, key, tags, CacheTags); err != nil {
		return fmt.Errorf("failed to cache tags: %w", err)
	}

	logger.Info("Warmed tags cache", zap.Int("count", len(tags)))
	return nil
}

// StatsWarmupStrategy warms up statistics
type StatsWarmupStrategy struct {
	fetcher StatsFetcher
}

// StatsFetcher fetches statistics
type StatsFetcher interface {
	FetchStats(ctx context.Context) (StatsCacheData, error)
}

// StatsCacheData represents cached statistics
type StatsCacheData struct {
	TotalArticles int64
	TotalViews    int64
	TotalComments int64
	TotalLikes    int64
	TotalUsers    int64
	TotalFollows  int64
}

// NewStatsWarmupStrategy creates a new stats warmup strategy
func NewStatsWarmupStrategy(fetcher StatsFetcher) *StatsWarmupStrategy {
	return &StatsWarmupStrategy{
		fetcher: fetcher,
	}
}

func (s *StatsWarmupStrategy) Name() string {
	return "stats"
}

func (s *StatsWarmupStrategy) Priority() int {
	return 80
}

func (s *StatsWarmupStrategy) Warmup(ctx context.Context, cache *MultiLayerCache) error {
	stats, err := s.fetcher.FetchStats(ctx)
	if err != nil {
		return fmt.Errorf("failed to fetch stats: %w", err)
	}

	key := CacheKey(PrefixStats, "global")
	if err := cache.Set(ctx, key, stats, CacheStatsTTL); err != nil {
		return fmt.Errorf("failed to cache stats: %w", err)
	}

	logger.Info("Warmed stats cache")
	return nil
}

// SitemapWarmupStrategy warms up sitemap
type SitemapWarmupStrategy struct {
	fetcher SitemapFetcher
}

// SitemapFetcher fetches sitemap data
type SitemapFetcher interface {
	FetchSitemap(ctx context.Context) ([]SitemapEntry, error)
}

// SitemapEntry represents a sitemap entry
type SitemapEntry struct {
	URL        string
	LastMod    time.Time
	ChangeFreq string
	Priority   float64
}

// NewSitemapWarmupStrategy creates a new sitemap warmup strategy
func NewSitemapWarmupStrategy(fetcher SitemapFetcher) *SitemapWarmupStrategy {
	return &SitemapWarmupStrategy{
		fetcher: fetcher,
	}
}

func (s *SitemapWarmupStrategy) Name() string {
	return "sitemap"
}

func (s *SitemapWarmupStrategy) Priority() int {
	return 50
}

func (s *SitemapWarmupStrategy) Warmup(ctx context.Context, cache *MultiLayerCache) error {
	sitemap, err := s.fetcher.FetchSitemap(ctx)
	if err != nil {
		return fmt.Errorf("failed to fetch sitemap: %w", err)
	}

	key := CacheKey(PrefixSitemap, "main")
	if err := cache.Set(ctx, key, sitemap, CacheSitemap); err != nil {
		return fmt.Errorf("failed to cache sitemap: %w", err)
	}

	logger.Info("Warmed sitemap cache", zap.Int("entries", len(sitemap)))
	return nil
}

// CacheInvalidationStrategy defines cache invalidation rules
type CacheInvalidationStrategy struct {
	cache *MultiLayerCache
}

// NewCacheInvalidationStrategy creates a new invalidation strategy
func NewCacheInvalidationStrategy(cache *MultiLayerCache) *CacheInvalidationStrategy {
	return &CacheInvalidationStrategy{
		cache: cache,
	}
}

// InvalidateArticle invalidates all caches related to an article
func (s *CacheInvalidationStrategy) InvalidateArticle(ctx context.Context, slug string) error {
	// Delete article detail
	articleKey := CacheKey(PrefixArticle, slug)
	if err := s.cache.Delete(ctx, articleKey); err != nil {
		logger.Error("Failed to invalidate article cache", zap.String("slug", slug), zap.Error(err))
	}

	// Delete article list caches
	pattern := fmt.Sprintf("tzblog:%s:*", PrefixArticleList)
	if err := s.cache.DeletePattern(ctx, pattern); err != nil {
		logger.Error("Failed to invalidate article list cache", zap.Error(err))
	}

	// Delete popular articles
	popularKey := CacheKey(PrefixPopular, "articles")
	if err := s.cache.Delete(ctx, popularKey); err != nil {
		logger.Error("Failed to invalidate popular cache", zap.Error(err))
	}

	return nil
}

// InvalidateTag invalidates all caches related to a tag
func (s *CacheInvalidationStrategy) InvalidateTag(ctx context.Context, slug string) error {
	// Delete tag detail
	tagKey := CacheKey(PrefixTag, slug)
	if err := s.cache.Delete(ctx, tagKey); err != nil {
		logger.Error("Failed to invalidate tag cache", zap.String("slug", slug), zap.Error(err))
	}

	// Delete all tags list
	allTagsKey := CacheKey(PrefixTag, "all")
	if err := s.cache.Delete(ctx, allTagsKey); err != nil {
		logger.Error("Failed to invalidate tags list cache", zap.Error(err))
	}

	return nil
}

// InvalidateStats invalidates statistics cache
func (s *CacheInvalidationStrategy) InvalidateStats(ctx context.Context) error {
	statsKey := CacheKey(PrefixStats, "global")
	return s.cache.Delete(ctx, statsKey)
}

// InvalidateAll invalidates all caches
func (s *CacheInvalidationStrategy) InvalidateAll(ctx context.Context) error {
	pattern := "tzblog:*"
	return s.cache.DeletePattern(ctx, pattern)
}
