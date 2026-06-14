package comment

import (
	"errors"
	"strings"
	"time"

	"github.com/MICBIK/TZBlog/backend/pkg/sanitizer"
)

// Errors
var (
	ErrInvalidParent    = errors.New("invalid parent comment")
	ErrCommentNotFound  = errors.New("comment not found")
	ErrUnauthorized     = errors.New("unauthorized to perform this action")
	ErrInvalidContent   = errors.New("comment content is required")
	ErrContentTooLong   = errors.New("comment content is too long (max 1000 characters)")
	ErrInvalidArticleID = errors.New("article ID is required")
	ErrInvalidUserID    = errors.New("user ID is required")
)

// Comment represents a comment entity
type Comment struct {
	ID        int64      `json:"id" gorm:"primaryKey"`
	ArticleID int64      `json:"articleId" gorm:"not null;index"`
	UserID    int64      `json:"userId" gorm:"not null;index"`
	ParentID  *int64     `json:"parentId,omitempty" gorm:"index"`
	Content   string     `json:"content" gorm:"type:text;not null"`
	Status    string     `json:"status" gorm:"default:'published'"` // published, pending, deleted
	CreatedAt time.Time  `json:"createdAt"`
	UpdatedAt time.Time  `json:"updatedAt"`
	DeletedAt *time.Time `json:"deletedAt,omitempty" gorm:"index"`
}

// TableName returns the table name
func (Comment) TableName() string {
	return "comments"
}

// Validate validates the comment fields
func (c *Comment) Validate() error {
	// Validate content
	if strings.TrimSpace(c.Content) == "" {
		return ErrInvalidContent
	}
	if len(c.Content) > 1000 {
		return ErrContentTooLong
	}

	// Validate article ID
	if c.ArticleID <= 0 {
		return ErrInvalidArticleID
	}

	// Validate user ID
	if c.UserID <= 0 {
		return ErrInvalidUserID
	}

	return nil
}

// SanitizeContent sanitizes comment content to prevent XSS attacks
func (c *Comment) SanitizeContent() {
	// Sanitize comment content (strict - minimal HTML allowed)
	c.Content = sanitizer.SanitizeComment(c.Content)
}

// CanBeEditedBy checks if a user can edit this comment
func (c *Comment) CanBeEditedBy(userID int64) bool {
	return c.UserID == userID
}

// ListFilter defines comment list filter options
type ListFilter struct {
	ArticleID int64
	UserID    int64
	Status    string
	Limit     int
	Offset    int
	OrderBy   string
}

// Repository is an alias for CommentRepository (backward compatibility)
type Repository = CommentRepository

// CommentRepository defines the interface for comment operations
type CommentRepository interface {
	Create(comment *Comment) error
	FindByID(id int64) (*Comment, error)
	FindByArticleID(articleID int64, limit, offset int) ([]*Comment, int64, error)
	List(filter *ListFilter) ([]*Comment, int64, error)
	Update(comment *Comment) error
	Delete(id int64) error
	CountByArticleID(articleID int64) (int64, error)
}
