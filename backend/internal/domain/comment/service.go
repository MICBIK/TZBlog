package comment

// Service defines the interface for comment business logic operations
type Service interface {
	// CreateComment creates a new comment
	CreateComment(userID int64, dto *CreateCommentDTO) (*Comment, error)

	// GetCommentByID retrieves a comment by ID
	GetCommentByID(id int64) (*Comment, error)

	// ListComments retrieves a list of comments based on filter
	ListComments(filter *ListFilter) ([]*Comment, int64, error)

	// UpdateComment updates an existing comment
	UpdateComment(id, userID int64, dto *UpdateCommentDTO) (*Comment, error)

	// DeleteComment soft deletes a comment
	DeleteComment(id, userID int64) error

	// GetCommentCountByArticle returns the total comment count for an article
	GetCommentCountByArticle(articleID int64) (int64, error)
}

// CreateCommentDTO represents the request data for creating a comment
type CreateCommentDTO struct {
	ArticleID int64  `json:"article_id" binding:"required"`
	ParentID  *int64 `json:"parent_id"`
	Content   string `json:"content" binding:"required,max=1000"`
}

// UpdateCommentDTO represents the request data for updating a comment
type UpdateCommentDTO struct {
	Content string `json:"content" binding:"required,max=1000"`
}
