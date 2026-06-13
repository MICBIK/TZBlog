package postgres

import (
	"time"

	"github.com/MICBIK/TZBlog/backend/internal/domain/stats"
	"gorm.io/gorm"
)

type statsRepository struct {
	db *gorm.DB
}

func NewStatsRepository(db *gorm.DB) stats.StatsRepository {
	return &statsRepository{db: db}
}

func (r *statsRepository) GetOverviewStats() (*stats.OverviewStats, error) {
	var overview stats.OverviewStats

	r.db.Model(&struct{ ID int64 }{}).Table("articles").
		Where("deleted_at IS NULL").Count(&overview.TotalArticles)

	r.db.Model(&struct{ ID int64 }{}).Table("users").
		Where("deleted_at IS NULL").Count(&overview.TotalUsers)

	r.db.Model(&struct{ ID int64 }{}).Table("article_views").Count(&overview.TotalViews)

	r.db.Model(&struct{ ID int64 }{}).Table("comments").
		Where("deleted_at IS NULL").Count(&overview.TotalComments)

	todayStart := time.Now().Truncate(24 * time.Hour).Unix()
	r.db.Model(&struct{ ID int64 }{}).Table("article_views").
		Where("created_at >= ?", todayStart).Count(&overview.TodayViews)

	r.db.Model(&struct{ ID int64 }{}).Table("comments").
		Where("deleted_at IS NULL AND created_at >= ?", todayStart).Count(&overview.TodayComments)

	return &overview, nil
}

func (r *statsRepository) GetArticleStats() (*stats.ArticleStats, error) {
	var articleStats stats.ArticleStats

	r.db.Model(&struct{ ID int64 }{}).Table("articles").
		Where("status = ? AND deleted_at IS NULL", "published").Count(&articleStats.Published)

	r.db.Model(&struct{ ID int64 }{}).Table("articles").
		Where("status = ? AND deleted_at IS NULL", "draft").Count(&articleStats.Draft)

	r.db.Model(&struct{ ID int64 }{}).Table("articles").
		Where("is_featured = true AND deleted_at IS NULL").Count(&articleStats.Featured)

	r.db.Model(&struct{ ID int64 }{}).Table("articles").
		Where("is_premium = true AND deleted_at IS NULL").Count(&articleStats.Premium)

	return &articleStats, nil
}

func (r *statsRepository) GetTrafficStats() (*stats.TrafficStats, error) {
	var trafficStats stats.TrafficStats

	r.db.Model(&struct{ ID int64 }{}).Table("article_views").
		Select("COUNT(DISTINCT ip_address)").Row().Scan(&trafficStats.UniqueVisitors)

	r.db.Model(&struct{ ID int64 }{}).Table("article_views").Count(&trafficStats.PageViews)

	// 最近7天的日访问量
	var dailyViews []stats.DailyViewStats
	r.db.Raw(`
		SELECT DATE(to_timestamp(created_at)) as date, COUNT(*) as views
		FROM article_views
		WHERE created_at >= ?
		GROUP BY DATE(to_timestamp(created_at))
		ORDER BY date DESC
	`, time.Now().AddDate(0, 0, -7).Unix()).Scan(&dailyViews)

	trafficStats.DailyViews = dailyViews

	return &trafficStats, nil
}
