package postgres

import (
	"errors"

	"github.com/MICBIK/TZBlog/backend/internal/domain/comment"
	"gorm.io/gorm"
)

type commentRepository struct {
	db *gorm.DB
}

func NewCommentRepository(db *gorm.DB) comment.CommentRepository {
	return &commentRepository{db: db}
}

func (r *commentRepository) Create(c *comment.Comment) error {
	return r.db.Create(c).Error
}

func (r *commentRepository) FindByArticleID(articleID int64, limit, offset int) ([]*comment.Comment, int64, error) {
	var comments []*comment.Comment
	var total int64

	query := r.db.Model(&comment.Comment{}).
		Where("article_id = ? AND deleted_at IS NULL", articleID)

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := query.Preload("User").
		Order("created_at DESC").
		Limit(limit).Offset(offset).
		Find(&comments).Error

	return comments, total, err
}

func (r *commentRepository) FindByID(id int64) (*comment.Comment, error) {
	var c comment.Comment
	err := r.db.Preload("User").
		Where("id = ? AND deleted_at IS NULL", id).First(&c).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &c, nil
}

func (r *commentRepository) Delete(id int64) error {
	return r.db.Model(&comment.Comment{}).
		Where("id = ?", id).
		Update("deleted_at", gorm.Expr("EXTRACT(EPOCH FROM NOW())")).Error
}
