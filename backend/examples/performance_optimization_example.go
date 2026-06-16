//go:build ignore

// Package main demonstrates performance optimization usage
package main

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/MICBIK/TZBlog/backend/config"
	"github.com/MICBIK/TZBlog/backend/internal/cache"
	"github.com/MICBIK/TZBlog/backend/internal/domain/article"
	"github.com/MICBIK/TZBlog/backend/internal/repository/postgres"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

// Example demonstrates how to use Phase 3 performance optimizations
func Example(db *gorm.DB, redisClient *redis.Client) {
	ctx := context.Background()

	// 1. Multi-layer cache setup
	mlCache := cache.NewMultiLayerCache(redisClient, 1000, 5*time.Minute, 10*time.Minute)

	// 2. Cache warming setup
	warmer := cache.NewCacheWarmer(mlCache)
	// warmer.RegisterStrategy(cache.NewPopularArticlesWarmupStrategy(articleFetcher))
	// warmer.RegisterStrategy(cache.NewTagsWarmupStrategy(tagFetcher))

	// Execute warmup
	if err := warmer.WarmupAll(ctx); err != nil {
		log.Printf("Cache warmup failed: %v", err)
	}

	// 3. Connection pool monitoring
	sqlDB, _ := db.DB()
	monitor := config.NewConnectionPoolMonitor(
		sqlDB,
		config.DefaultPoolAlertThresholds(),
	)
	go monitor.Start(ctx)

	// Check health periodically
	go func() {
		ticker := time.NewTicker(1 * time.Minute)
		defer ticker.Stop()
		for range ticker.C {
			report := monitor.GetHealthReport()
			if report.Health != "HEALTHY" {
				log.Printf("Connection pool issue: %s (utilization: %.1f%%)",
					report.Health, report.Utilization*100)
			}
		}
	}()

	// 4. Query analysis (development only)
	analyzer := postgres.NewQueryAnalyzer(db)

	// Analyze a slow query
	result, err := analyzer.AnalyzeQuery(ctx, `
		SELECT * FROM articles
		WHERE status = 'published'
		ORDER BY created_at DESC
		LIMIT 20
	`)
	if err == nil {
		fmt.Printf("Query execution time: %v\n", result.ExecutionTime)
		if len(result.Warnings) > 0 {
			fmt.Printf("Warnings: %v\n", result.Warnings)
		}
	}

	// 5. Batch operations
	batchOps := postgres.NewBatchOperations(db)

	// Batch insert example
	articles := []*article.Article{
		{Title: "Article 1", Slug: "article-1", Content: "Content 1", AuthorID: 1, Status: "published"},
		{Title: "Article 2", Slug: "article-2", Content: "Content 2", AuthorID: 1, Status: "published"},
	}
	if err := batchOps.BatchInsertArticles(ctx, articles); err != nil {
		log.Printf("Batch insert failed: %v", err)
	}

	// Batch update example
	ids := []int64{1, 2, 3, 4, 5}
	if err := batchOps.BatchUpdateArticleStatus(ctx, ids, "published"); err != nil {
		log.Printf("Batch update failed: %v", err)
	}

	// 6. Cache invalidation
	invalidation := cache.NewCacheInvalidationStrategy(mlCache)

	// When article is updated
	if err := invalidation.InvalidateArticle(ctx, "article-slug"); err != nil {
		log.Printf("Cache invalidation failed: %v", err)
	}

	// 7. Monitor cache statistics
	stats := mlCache.GetStats()
	fmt.Printf("L1 Hit Rate: %.2f%%\n", stats.L1HitRate*100)
	fmt.Printf("L2 Hit Rate: %.2f%%\n", stats.L2HitRate*100)
	fmt.Printf("Overall Hit Rate: %.2f%%\n", stats.OverallHitRate*100)
}

// ProductionConfig returns production-ready configuration
func ProductionConfig() (*config.DatabasePoolConfig, config.PoolAlertThresholds) {
	poolConfig := config.OptimizedPoolConfig()

	alertThresholds := config.PoolAlertThresholds{
		MaxUtilization:  0.7, // Alert at 70% utilization
		MaxWaitDuration: 50 * time.Millisecond,
		MaxWaitCount:    100,
		MaxIdleClosed:   50,
		CheckInterval:   30 * time.Second,
	}

	return poolConfig, alertThresholds
}

// PerformanceOptimizationChecklist shows what to enable
func PerformanceOptimizationChecklist() {
	fmt.Println("Performance Optimization Checklist:")
	fmt.Println("✅ 1. Enable multi-layer cache (L1 + L2)")
	fmt.Println("✅ 2. Configure cache warming on startup")
	fmt.Println("✅ 3. Enable connection pool monitoring")
	fmt.Println("✅ 4. Set up connection leak detection")
	fmt.Println("✅ 5. Use batch operations for bulk inserts/updates")
	fmt.Println("✅ 6. Implement cache invalidation strategy")
	fmt.Println("✅ 7. Enable pg_stat_statements for query analysis")
	fmt.Println("✅ 8. Monitor cache hit rates (target: 95%+)")
	fmt.Println("✅ 9. Monitor connection pool utilization (target: <70%)")
	fmt.Println("✅ 10. Review slow queries weekly")
}
