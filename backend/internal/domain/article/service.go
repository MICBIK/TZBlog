package article

// Service defines the interface for article business logic operations
type Service interface {
	// CreateArticle creates a new article
	CreateArticle(userID int64, dto *CreateArticleDTO) (*Article, error)

	// GetArticleByID retrieves an article by ID
	GetArticleByID(id int64) (*Article, error)

	// GetArticleBySlug retrieves an article by slug
	GetArticleBySlug(slug string) (*Article, error)

	// ListArticles retrieves a list of articles based on filter
	ListArticles(filter *ListFilter) ([]*Article, int64, error)

	// UpdateArticle updates an existing article
	UpdateArticle(id, userID int64, dto *UpdateArticleDTO) (*Article, error)

	// DeleteArticle soft deletes an article
	DeleteArticle(id, userID int64) error

	// PatchArticle partially updates an article
	PatchArticle(slug string, userID int64, updates map[string]interface{}) (*Article, error)

	// BatchDelete deletes multiple articles
	BatchDelete(ids []int64, userID int64) (int, error)

	// BatchUpdateStatus updates status for multiple articles
	BatchUpdateStatus(ids []int64, userID int64, status string) (int, error)
}

// CreateArticleDTO represents the request data for creating an article
type CreateArticleDTO struct {
	Title      string   `json:"title" binding:"required,max=200"`
	Summary    string   `json:"summary"`
	Content    string   `json:"content" binding:"required"`
	CoverImage string   `json:"coverImage"`
	CategoryID int64    `json:"categoryId" binding:"required"`
	Tags       []string `json:"tags"`
	IsPremium  bool     `json:"isPremium"`
	Slug       string   `json:"slug"`
	Status     string   `json:"status" binding:"required,oneof=draft published"`
}

// UpdateArticleDTO represents the request data for updating an article
type UpdateArticleDTO struct {
	Title      *string `json:"title" binding:"omitempty,max=200"`
	Summary    *string `json:"summary"`
	Content    *string `json:"content"`
	CoverImage *string `json:"coverImage"`
	Status     *string `json:"status" binding:"omitempty,oneof=draft published archived"`
}
