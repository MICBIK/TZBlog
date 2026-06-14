package postgres

import (
	"github.com/MICBIK/TZBlog/backend/internal/domain/like"
	"gorm.io/gorm"
)

// LikeRepository implements like.LikeRepository
type LikeRepository struct {
	db *gorm.DB
}

// NewLikeRepository creates a new like repository
func NewLikeRepository(db *gorm.DB) like.LikeRepository {
	return &LikeRepository{db: db}
}

// Create creates a new like
func (r *LikeRepository) Create(l *like.Like) error {
	return r.db.Create(l).Error
}

// Delete deletes a like by article ID and user ID
func (r *LikeRepository) Delete(articleID, userID int64) error {
	return r.db.Where("article_id = ? AND user_id = ?", articleID, userID).
		Delete(&like.Like{}).Error
}

// IsLiked checks if a user has liked an article
func (r *LikeRepository) IsLiked(articleID, userID int64) (bool, error) {
	var count int64
	err := r.db.Model(&like.Like{}).
		Where("article_id = ? AND user_id = ?", articleID, userID).
		Count(&count).Error
	return count > 0, err
}

// CountByArticle counts likes for an article
func (r *LikeRepository) CountByArticle(articleID int64) (int64, error) {
	var count int64
	err := r.db.Model(&like.Like{}).
		Where("article_id = ?", articleID).
		Count(&count).Error
	return count, err
}
