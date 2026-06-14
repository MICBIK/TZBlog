package postgres

import (
	"time"

	"github.com/MICBIK/TZBlog/backend/internal/domain/view"
	"gorm.io/gorm"
)

// ViewRepository implements view.ViewRepository
type ViewRepository struct {
	db *gorm.DB
}

// NewViewRepository creates a new view repository
func NewViewRepository(db *gorm.DB) view.ViewRepository {
	return &ViewRepository{db: db}
}

// Create creates a new view record
func (r *ViewRepository) Create(v *view.View) error {
	return r.db.Create(v).Error
}

// CountByArticle counts total views for an article
func (r *ViewRepository) CountByArticle(articleID int64) (int64, error) {
	var count int64
	err := r.db.Model(&view.View{}).
		Where("article_id = ?", articleID).
		Count(&count).Error
	return count, err
}

// CountUnique counts unique views (by IP) for an article since a given time
func (r *ViewRepository) CountUnique(articleID int64, since time.Time) (int64, error) {
	var count int64
	err := r.db.Model(&view.View{}).
		Where("article_id = ? AND created_at >= ?", articleID, since).
		Distinct("ip_address").
		Count(&count).Error
	return count, err
}
