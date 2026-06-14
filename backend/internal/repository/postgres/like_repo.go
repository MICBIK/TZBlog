package postgres

import (
	"github.com/MICBIK/TZBlog/backend/internal/domain/like"
	"gorm.io/gorm"
)

type likeRepository struct {
	db *gorm.DB
}

func NewLikeRepository(db *gorm.DB) like.LikeRepository {
	return &likeRepository{db: db}
}

func (r *likeRepository) Create(l *like.Like) error {
	return r.db.Create(l).Error
}

func (r *likeRepository) Delete(userID, targetID int64, targetType string) error {
	return r.db.Where("user_id = ? AND target_id = ? AND target_type = ?",
		userID, targetID, targetType).Delete(&like.Like{}).Error
}

func (r *likeRepository) HasLiked(userID, targetID int64, targetType string) (bool, error) {
	var count int64
	err := r.db.Model(&like.Like{}).
		Where("user_id = ? AND target_id = ? AND target_type = ?",
			userID, targetID, targetType).
		Count(&count).Error
	return count > 0, err
}

func (r *likeRepository) GetLikeCount(targetID int64, targetType string) (int, error) {
	var count int64
	err := r.db.Model(&like.Like{}).
		Where("target_id = ? AND target_type = ?", targetID, targetType).
		Count(&count).Error
	return int(count), err
}
