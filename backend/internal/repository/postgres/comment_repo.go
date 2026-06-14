package postgres

import (
	"github.com/MICBIK/TZBlog/backend/internal/domain/comment"
	"gorm.io/gorm"
)

// CommentRepository implements comment.CommentRepository
type CommentRepository struct {
	db *gorm.DB
}

// NewCommentRepository creates a new comment repository
func NewCommentRepository(db *gorm.DB) comment.CommentRepository {
	return &CommentRepository{db: db}
}

// Create creates a new comment
func (r *CommentRepository) Create(c *comment.Comment) error {
	return r.db.Create(c).Error
}

// FindByID finds a comment by ID
func (r *CommentRepository) FindByID(id int64) (*comment.Comment, error) {
	var c comment.Comment
	err := r.db.First(&c, id).Error
	if err == gorm.ErrRecordNotFound {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &c, nil
}

// FindByArticleID finds comments by article ID
func (r *CommentRepository) FindByArticleID(articleID int64, limit, offset int) ([]*comment.Comment, int64, error) {
	var comments []*comment.Comment
	var total int64

	if err := r.db.Model(&comment.Comment{}).Where("article_id = ?", articleID).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := r.db.Where("article_id = ?", articleID).
		Limit(limit).
		Offset(offset).
		Order("created_at DESC").
		Find(&comments).Error

	return comments, total, err
}

// List returns paginated comments based on filter
func (r *CommentRepository) List(filter *comment.ListFilter) ([]*comment.Comment, int64, error) {
	var comments []*comment.Comment
	var total int64

	query := r.db.Model(&comment.Comment{})

	if filter.ArticleID > 0 {
		query = query.Where("article_id = ?", filter.ArticleID)
	}
	if filter.UserID > 0 {
		query = query.Where("user_id = ?", filter.UserID)
	}
	if filter.Status != "" {
		query = query.Where("status = ?", filter.Status)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	orderBy := "created_at DESC"
	if filter.OrderBy != "" {
		orderBy = filter.OrderBy
	}

	err := query.Limit(filter.Limit).
		Offset(filter.Offset).
		Order(orderBy).
		Find(&comments).Error

	return comments, total, err
}

// Update updates a comment
func (r *CommentRepository) Update(c *comment.Comment) error {
	return r.db.Save(c).Error
}

// Delete deletes a comment
func (r *CommentRepository) Delete(id int64) error {
	return r.db.Delete(&comment.Comment{}, id).Error
}

// CountByArticleID counts comments for an article
func (r *CommentRepository) CountByArticleID(articleID int64) (int64, error) {
	var count int64
	err := r.db.Model(&comment.Comment{}).
		Where("article_id = ?", articleID).
		Count(&count).Error
	return count, err
}
