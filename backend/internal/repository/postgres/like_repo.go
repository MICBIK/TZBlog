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

// Delete deletes a like by user ID, target type and target ID
func (r *LikeRepository) Delete(userID int64, targetType like.TargetType, targetID int64) error {
	return r.db.Where("user_id = ? AND target_type = ? AND target_id = ?", userID, targetType, targetID).
		Delete(&like.Like{}).Error
}

// IsLiked checks if a user has liked a target
func (r *LikeRepository) IsLiked(userID int64, targetType like.TargetType, targetID int64) (bool, error) {
	var count int64
	err := r.db.Model(&like.Like{}).
		Where("user_id = ? AND target_type = ? AND target_id = ?", userID, targetType, targetID).
		Count(&count).Error
	return count > 0, err
}

// CountByTarget counts likes for a target
func (r *LikeRepository) CountByTarget(targetType like.TargetType, targetID int64) (int64, error) {
	var count int64
	err := r.db.Model(&like.Like{}).
		Where("target_type = ? AND target_id = ?", targetType, targetID).
		Count(&count).Error
	return count, err
}
