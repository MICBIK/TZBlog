package service

import (
	"github.com/MICBIK/TZBlog/backend/internal/domain/comment"
)

// CommentService handles comment business logic
type CommentService struct {
	repo comment.Repository
}

// NewCommentService creates a new comment service
func NewCommentService(repo comment.Repository) comment.Service {
	return &CommentService{
		repo: repo,
	}
}

// CreateComment creates a new comment
func (s *CommentService) CreateComment(userID int64, dto *comment.CreateCommentDTO) (*comment.Comment, error) {
	// Create comment entity
	newComment := &comment.Comment{
		ArticleID: dto.ArticleID,
		UserID:    userID,
		ParentID:  dto.ParentID,
		Content:   dto.Content,
	}

	// Validate parent comment if it's a reply
	if newComment.ParentID != nil {
		parent, err := s.repo.FindByID(*newComment.ParentID)
		if err != nil {
			return nil, err
		}
		if parent == nil {
			return nil, comment.ErrInvalidParent
		}
		// Ensure parent comment is on the same article
		if parent.ArticleID != dto.ArticleID {
			return nil, comment.ErrInvalidParent
		}
	}

	// ✅ SEC-001 FIX: Sanitize content to prevent XSS attacks
	newComment.SanitizeContent()

	// Validate comment
	if err := newComment.Validate(); err != nil {
		return nil, err
	}

	// Save to repository
	if err := s.repo.Create(newComment); err != nil {
		return nil, err
	}

	return newComment, nil
}

// GetCommentByID retrieves a comment by ID
func (s *CommentService) GetCommentByID(id int64) (*comment.Comment, error) {
	c, err := s.repo.FindByID(id)
	if err != nil {
		return nil, err
	}
	if c == nil {
		return nil, comment.ErrCommentNotFound
	}
	return c, nil
}

// ListComments retrieves a list of comments based on filter
func (s *CommentService) ListComments(filter *comment.ListFilter) ([]*comment.Comment, int64, error) {
	// Set default values
	if filter.Limit <= 0 {
		filter.Limit = 20
	}
	if filter.Limit > 100 {
		filter.Limit = 100
	}
	// Offset is managed by the repository layer based on filter
	if filter.OrderBy == "" {
		filter.OrderBy = "created_at DESC"
	}

	return s.repo.List(filter)
}

// UpdateComment updates an existing comment
func (s *CommentService) UpdateComment(id, userID int64, dto *comment.UpdateCommentDTO) (*comment.Comment, error) {
	// Fetch existing comment
	c, err := s.repo.FindByID(id)
	if err != nil {
		return nil, err
	}
	if c == nil {
		return nil, comment.ErrCommentNotFound
	}

	// Check permission
	if !c.CanBeEditedBy(userID) {
		return nil, comment.ErrUnauthorized
	}

	// Update content
	c.Content = dto.Content

	// ✅ SEC-001 FIX: Sanitize content to prevent XSS attacks
	c.SanitizeContent()

	// Validate updated comment
	if err := c.Validate(); err != nil {
		return nil, err
	}

	// Save changes
	if err := s.repo.Update(c); err != nil {
		return nil, err
	}

	return c, nil
}

// DeleteComment soft deletes a comment
func (s *CommentService) DeleteComment(id, userID int64) error {
	// Fetch existing comment
	c, err := s.repo.FindByID(id)
	if err != nil {
		return err
	}
	if c == nil {
		return comment.ErrCommentNotFound
	}

	// Check permission
	if !c.CanBeEditedBy(userID) {
		return comment.ErrUnauthorized
	}

	// Delete comment
	return s.repo.Delete(id)
}

// GetCommentCountByArticle returns the total comment count for an article
func (s *CommentService) GetCommentCountByArticle(articleID int64) (int64, error) {
	return s.repo.CountByArticleID(articleID)
}
