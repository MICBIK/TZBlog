package postgres

import (
	"gorm.io/gorm"
)

type StatsRepository struct {
	db *gorm.DB
}

func NewStatsRepository(db *gorm.DB) *StatsRepository {
	return &StatsRepository{db: db}
}

// StatsResult holds aggregated statistics
type StatsResult struct {
	TotalArticles int64
	TotalViews    int64
	TotalComments int64
	TotalLikes    int64
	TotalUsers    int64
	TotalFollows  int64
}

// GetAllStats retrieves all statistics in a single optimized query
// This fixes PERF-002: previously 6 separate COUNT queries, now merged into 1
func (r *StatsRepository) GetAllStats() (*StatsResult, error) {
	var result StatsResult

	// Use a single query with subqueries to fetch all counts at once
	err := r.db.Raw(`
		SELECT
			(SELECT COUNT(*) FROM articles WHERE deleted_at IS NULL) as total_articles,
			(SELECT COALESCE(SUM(view_count), 0) FROM articles WHERE deleted_at IS NULL) as total_views,
			(SELECT COUNT(*) FROM comments WHERE deleted_at IS NULL) as total_comments,
			(SELECT COALESCE(SUM(like_count), 0) FROM articles WHERE deleted_at IS NULL) as total_likes,
			(SELECT COUNT(*) FROM users WHERE deleted_at IS NULL) as total_users,
			(SELECT COUNT(*) FROM follows) as total_follows
	`).Scan(&result).Error

	return &result, err
}

// Individual getter methods for backward compatibility
func (r *StatsRepository) GetTotalArticles() (int64, error) {
	var count int64
	err := r.db.Model(&struct {
		ID        int64
		DeletedAt *gorm.DeletedAt `gorm:"index"`
	}{}).
		Table("articles").
		Count(&count).Error
	return count, err
}

func (r *StatsRepository) GetTotalViews() (int64, error) {
	var total int64
	err := r.db.Table("articles").
		Select("COALESCE(SUM(view_count), 0)").
		Where("deleted_at IS NULL").
		Scan(&total).Error
	return total, err
}

func (r *StatsRepository) GetTotalComments() (int64, error) {
	var count int64
	err := r.db.Model(&struct {
		ID        int64
		DeletedAt *gorm.DeletedAt `gorm:"index"`
	}{}).
		Table("comments").
		Count(&count).Error
	return count, err
}

func (r *StatsRepository) GetTotalLikes() (int64, error) {
	var total int64
	err := r.db.Table("articles").
		Select("COALESCE(SUM(like_count), 0)").
		Where("deleted_at IS NULL").
		Scan(&total).Error
	return total, err
}

func (r *StatsRepository) GetTotalUsers() (int64, error) {
	var count int64
	err := r.db.Model(&struct {
		ID        int64
		DeletedAt *gorm.DeletedAt `gorm:"index"`
	}{}).
		Table("users").
		Count(&count).Error
	return count, err
}

func (r *StatsRepository) GetTotalFollows() (int64, error) {
	var count int64
	err := r.db.Table("follows").Count(&count).Error
	return count, err
}

// ArticleStats represents basic article information for popular articles
type ArticleStats struct {
	ID        int64  `gorm:"column:id"`
	Title     string `gorm:"column:title"`
	Slug      string `gorm:"column:slug"`
	ViewCount int64  `gorm:"column:view_count"`
	AuthorID  int64  `gorm:"column:author_id"`
}

func (ArticleStats) TableName() string {
	return "articles"
}

// GetPopularArticles returns the most viewed articles
// Note: Caller should handle Author and Tags preloading if needed
func (r *StatsRepository) GetPopularArticles(limit int) ([]*ArticleStats, error) {
	var articles []*ArticleStats

	err := r.db.Table("articles").
		Select("id, title, slug, view_count, author_id").
		Where("deleted_at IS NULL").
		Order("view_count DESC").
		Limit(limit).
		Find(&articles).Error

	return articles, err
}
