package service

import (
	"time"

	"github.com/MICBIK/TZBlog/backend/internal/domain/article"
)

// ArticleService handles article business logic
type ArticleService struct {
	repo article.Repository
}

// NewArticleService creates a new article service
func NewArticleService(repo article.Repository) *ArticleService {
	return &ArticleService{
		repo: repo,
	}
}

// CreateArticleDTO represents the request data for creating an article
type CreateArticleDTO struct {
	Title      string `json:"title" binding:"required,max=200"`
	Summary    string `json:"summary"`
	Content    string `json:"content" binding:"required"`
	CoverImage string `json:"cover_image"`
	Status     string `json:"status" binding:"required,oneof=draft published"`
}

// UpdateArticleDTO represents the request data for updating an article
type UpdateArticleDTO struct {
	Title      *string `json:"title" binding:"omitempty,max=200"`
	Summary    *string `json:"summary"`
	Content    *string `json:"content"`
	CoverImage *string `json:"cover_image"`
	Status     *string `json:"status" binding:"omitempty,oneof=draft published archived"`
}

// CreateArticle creates a new article
func (s *ArticleService) CreateArticle(userID int64, dto *CreateArticleDTO) (*article.Article, error) {
	// Create article entity
	newArticle := &article.Article{
		AuthorID:   userID,
		Title:      dto.Title,
		Summary:    dto.Summary,
		Content:    dto.Content,
		CoverImage: dto.CoverImage,
		Status:     dto.Status,
	}

	// Generate slug from title
	newArticle.GenerateSlug()

	// Calculate reading time
	newArticle.CalculateReadingTime()

	// Set published time if status is published
	if dto.Status == article.StatusPublished {
		now := time.Now()
		newArticle.PublishedAt = &now
	}

	// Validate article
	if err := newArticle.Validate(); err != nil {
		return nil, err
	}

	// Save to repository
	if err := s.repo.Create(newArticle); err != nil {
		return nil, err
	}

	return newArticle, nil
}

// GetArticleByID retrieves an article by ID
func (s *ArticleService) GetArticleByID(id int64) (*article.Article, error) {
	art, err := s.repo.FindByID(id)
	if err != nil {
		return nil, err
	}
	if art == nil {
		return nil, article.ErrArticleNotFound
	}
	return art, nil
}

// GetArticleBySlug retrieves an article by slug and increments view count
func (s *ArticleService) GetArticleBySlug(slug string) (*article.Article, error) {
	art, err := s.repo.FindBySlug(slug)
	if err != nil {
		return nil, err
	}
	if art == nil {
		return nil, article.ErrArticleNotFound
	}

	// Increment view count asynchronously (best effort)
	go func() {
		_ = s.repo.IncrementViewCount(art.ID)
	}()

	return art, nil
}

// ListArticles retrieves a list of articles based on filter
func (s *ArticleService) ListArticles(filter *article.ListFilter) ([]*article.Article, int64, error) {
	// Set default values
	if filter.Limit <= 0 {
		filter.Limit = 10
	}
	if filter.Limit > 100 {
		filter.Limit = 100
	}
	if filter.Page <= 0 {
		filter.Page = 1
	}
	if filter.OrderBy == "" {
		filter.OrderBy = "created_at DESC"
	}

	return s.repo.List(filter)
}

// UpdateArticle updates an existing article
func (s *ArticleService) UpdateArticle(id, userID int64, dto *UpdateArticleDTO) (*article.Article, error) {
	// Fetch existing article
	art, err := s.repo.FindByID(id)
	if err != nil {
		return nil, err
	}
	if art == nil {
		return nil, article.ErrArticleNotFound
	}

	// Check permission
	if !art.CanBeEditedBy(userID) {
		return nil, article.ErrUnauthorized
	}

	// Update fields
	updated := false
	if dto.Title != nil && *dto.Title != art.Title {
		art.Title = *dto.Title
		art.GenerateSlug()
		updated = true
	}
	if dto.Summary != nil && *dto.Summary != art.Summary {
		art.Summary = *dto.Summary
		updated = true
	}
	if dto.Content != nil && *dto.Content != art.Content {
		art.Content = *dto.Content
		art.CalculateReadingTime()
		updated = true
	}
	if dto.CoverImage != nil && *dto.CoverImage != art.CoverImage {
		art.CoverImage = *dto.CoverImage
		updated = true
	}
	if dto.Status != nil && *dto.Status != art.Status {
		oldStatus := art.Status
		art.Status = *dto.Status

		// Set published time when status changes to published
		if art.Status == article.StatusPublished && oldStatus != article.StatusPublished {
			now := time.Now()
			art.PublishedAt = &now
		}
		updated = true
	}

	if !updated {
		return art, nil
	}

	// Validate updated article
	if err := art.Validate(); err != nil {
		return nil, err
	}

	// Save changes
	if err := s.repo.Update(art); err != nil {
		return nil, err
	}

	return art, nil
}

// DeleteArticle soft deletes an article
func (s *ArticleService) DeleteArticle(id, userID int64) error {
	// Fetch existing article
	art, err := s.repo.FindByID(id)
	if err != nil {
		return err
	}
	if art == nil {
		return article.ErrArticleNotFound
	}

	// Check permission
	if !art.CanBeEditedBy(userID) {
		return article.ErrUnauthorized
	}

	// Delete article
	return s.repo.Delete(id)
}
