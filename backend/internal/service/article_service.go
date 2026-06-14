package service

import (
	"time"

	"github.com/MICBIK/TZBlog/backend/internal/domain/article"
	"github.com/MICBIK/TZBlog/backend/internal/domain/tag"
	"github.com/gosimple/slug"
)

// ArticleService handles article business logic
type ArticleService struct {
	repo    article.Repository
	tagRepo tag.TagRepository
}

// NewArticleService creates a new article service
func NewArticleService(repo article.Repository, tagRepo tag.TagRepository) article.Service {
	return &ArticleService{
		repo:    repo,
		tagRepo: tagRepo,
	}
}

// CreateArticle creates a new article
func (s *ArticleService) CreateArticle(userID int64, dto *article.CreateArticleDTO) (*article.Article, error) {
	// Create article entity
	newArticle := &article.Article{
		AuthorID:   userID,
		Title:      dto.Title,
		Summary:    dto.Summary,
		Content:    dto.Content,
		CoverImage: dto.CoverImage,
		CategoryID: dto.CategoryID,
		IsPremium:  dto.IsPremium,
		Status:     dto.Status,
	}

	// Use provided slug or generate from title
	if dto.Slug != "" {
		newArticle.Slug = dto.Slug
	} else {
		newArticle.GenerateSlug()
	}

	// Calculate reading time
	newArticle.CalculateReadingTime()

	// ✅ SEC-001 FIX: Sanitize content to prevent XSS attacks
	newArticle.SanitizeContent()

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

	// Handle tags if provided
	if len(dto.Tags) > 0 {
		tagIDs, err := s.findOrCreateTags(dto.Tags)
		if err != nil {
			// Log error but don't fail article creation
			// Tags can be added later
			// TODO: Add proper logging
		} else {
			// Attach tags to article
			if err := s.repo.AttachTags(newArticle.ID, tagIDs); err != nil {
				// Log error but don't fail article creation
				// TODO: Add proper logging
			}
		}
	}

	return newArticle, nil
}

// findOrCreateTags finds existing tags or creates new ones
func (s *ArticleService) findOrCreateTags(tagNames []string) ([]int64, error) {
	if len(tagNames) == 0 {
		return nil, nil
	}

	// Find existing tags
	existingTags, err := s.tagRepo.FindByNames(tagNames)
	if err != nil {
		return nil, err
	}

	// Build map of existing tag names
	existingMap := make(map[string]int64)
	for _, t := range existingTags {
		existingMap[t.Name] = t.ID
	}

	// Collect tag IDs and create missing tags
	var tagIDs []int64
	for _, name := range tagNames {
		if id, exists := existingMap[name]; exists {
			tagIDs = append(tagIDs, id)
		} else {
			// Create new tag
			newTag := &tag.Tag{
				Name: name,
				Slug: slug.Make(name),
			}
			if err := s.tagRepo.Create(newTag); err != nil {
				// Skip this tag if creation fails
				continue
			}
			tagIDs = append(tagIDs, newTag.ID)
		}
	}

	return tagIDs, nil
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
func (s *ArticleService) UpdateArticle(id, userID int64, dto *article.UpdateArticleDTO) (*article.Article, error) {
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

	// ✅ SEC-001 FIX: Sanitize content to prevent XSS attacks
	art.SanitizeContent()

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
