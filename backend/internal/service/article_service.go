package service

import (
	"context"
	"time"

	"github.com/MICBIK/TZBlog/backend/internal/domain/article"
	"github.com/MICBIK/TZBlog/backend/internal/domain/tag"
	"github.com/MICBIK/TZBlog/backend/pkg/logger"
	"github.com/gosimple/slug"
	"go.uber.org/zap"
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

	// Increment view count asynchronously with timeout (CONTRACT-7-03 fix)
	go func() {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		// Create a channel to signal completion
		done := make(chan error, 1)
		go func() {
			done <- s.repo.IncrementViewCount(art.ID)
		}()

		// Wait for completion or timeout
		select {
		case err := <-done:
			if err != nil {
				logger.Error("failed to increment view count",
					zap.Int64("article_id", art.ID),
					zap.String("slug", art.Slug),
					zap.Error(err))
			}
		case <-ctx.Done():
			logger.Warn("increment view count timed out",
				zap.Int64("article_id", art.ID),
				zap.String("slug", art.Slug))
		}
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

// PatchArticle partially updates an article
func (s *ArticleService) PatchArticle(slug string, userID int64, updates map[string]interface{}) (*article.Article, error) {
	// Fetch existing article by slug
	art, err := s.repo.FindBySlug(slug)
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

	// Apply updates
	updated := false

	if title, ok := updates["title"].(string); ok && title != art.Title {
		art.Title = title
		art.GenerateSlug()
		updated = true
	}

	if summary, ok := updates["summary"].(string); ok && summary != art.Summary {
		art.Summary = summary
		updated = true
	}

	if content, ok := updates["content"].(string); ok && content != art.Content {
		art.Content = content
		art.CalculateReadingTime()
		updated = true
	}

	if coverImage, ok := updates["cover_image"].(string); ok && coverImage != art.CoverImage {
		art.CoverImage = coverImage
		updated = true
	}

	if status, ok := updates["status"].(string); ok && status != art.Status {
		oldStatus := art.Status
		art.Status = status

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

	// Sanitize content to prevent XSS attacks
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

// BatchDelete deletes multiple articles
func (s *ArticleService) BatchDelete(ids []int64, userID int64) (int, error) {
	if len(ids) == 0 {
		return 0, nil
	}

	// Limit batch size
	if len(ids) > 100 {
		return 0, article.ErrInvalidInput
	}

	deleted := 0
	for _, id := range ids {
		// Check each article's permission
		art, err := s.repo.FindByID(id)
		if err != nil {
			continue // Skip on error
		}
		if art == nil {
			continue // Skip if not found
		}

		// Check permission
		if !art.CanBeEditedBy(userID) {
			continue // Skip unauthorized
		}

		// Delete article
		if err := s.repo.Delete(id); err == nil {
			deleted++
		}
	}

	return deleted, nil
}

// BatchUpdateStatus updates status for multiple articles
func (s *ArticleService) BatchUpdateStatus(ids []int64, userID int64, status string) (int, error) {
	if len(ids) == 0 {
		return 0, nil
	}

	// Limit batch size
	if len(ids) > 100 {
		return 0, article.ErrInvalidInput
	}

	// Validate status
	validStatuses := map[string]bool{
		article.StatusDraft:     true,
		article.StatusPublished: true,
		article.StatusArchived:  true,
	}
	if !validStatuses[status] {
		return 0, article.ErrInvalidInput
	}

	updated := 0
	for _, id := range ids {
		// Check each article's permission
		art, err := s.repo.FindByID(id)
		if err != nil {
			continue // Skip on error
		}
		if art == nil {
			continue // Skip if not found
		}

		// Check permission
		if !art.CanBeEditedBy(userID) {
			continue // Skip unauthorized
		}

		// Update status
		oldStatus := art.Status
		art.Status = status

		// Set published time when status changes to published
		if art.Status == article.StatusPublished && oldStatus != article.StatusPublished {
			now := time.Now()
			art.PublishedAt = &now
		}

		// Save changes
		if err := s.repo.Update(art); err == nil {
			updated++
		}
	}

	return updated, nil
}
