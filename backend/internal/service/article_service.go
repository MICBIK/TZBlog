package service

import (
	"context"
	"errors"
	"strings"
	"time"

	internalcache "github.com/MICBIK/TZBlog/backend/internal/cache"
	"github.com/MICBIK/TZBlog/backend/internal/domain/article"
	"github.com/MICBIK/TZBlog/backend/internal/domain/tag"
	"github.com/MICBIK/TZBlog/backend/pkg/logger"
	"github.com/gosimple/slug"
	"go.uber.org/zap"
)

type articleDetailCache interface {
	GetArticleBySlug(slug string, dest interface{}) error
	SetArticle(slug string, article interface{}) error
	InvalidateArticleCache(slug string) error
}

// ArticleService handles article business logic
type ArticleService struct {
	repo         article.Repository
	tagRepo      tag.TagRepository
	articleCache articleDetailCache
}

// NewArticleService creates a new article service
func NewArticleService(repo article.Repository, tagRepo tag.TagRepository) article.Service {
	return &ArticleService{
		repo:    repo,
		tagRepo: tagRepo,
	}
}

// SetArticleCache wires article detail cache into the service.
func (s *ArticleService) SetArticleCache(articleCache articleDetailCache) {
	s.articleCache = articleCache
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

	s.invalidateArticleCache(newArticle.Slug)

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
	if s.articleCache != nil {
		var cached article.Article
		err := s.articleCache.GetArticleBySlug(slug, &cached)
		switch {
		case err == nil:
			s.incrementViewCountAsync(&cached)
			return &cached, nil
		case errors.Is(err, internalcache.ErrCacheMiss):
		default:
			logger.Warn("failed to read article from cache",
				zap.String("slug", slug),
				zap.Error(err))
		}
	}

	art, err := s.repo.FindBySlug(slug)
	if err != nil {
		return nil, err
	}
	if art == nil {
		return nil, article.ErrArticleNotFound
	}

	if s.articleCache != nil {
		if err := s.articleCache.SetArticle(slug, art); err != nil {
			logger.Warn("failed to populate article cache",
				zap.String("slug", slug),
				zap.Error(err))
		}
	}

	s.incrementViewCountAsync(art)

	return art, nil
}

func (s *ArticleService) incrementViewCountAsync(art *article.Article) {
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
				return
			}
			s.invalidateArticleCache(art.Slug)
		case <-ctx.Done():
			logger.Warn("increment view count timed out",
				zap.Int64("article_id", art.ID),
				zap.String("slug", art.Slug))
		}
	}()
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
		filter.OrderBy = "articles.created_at DESC"
	} else {
		filter.OrderBy = normalizeArticleOrderBy(filter.OrderBy)
	}

	return s.repo.List(filter)
}

func normalizeArticleOrderBy(sort string) string {
	switch strings.TrimSpace(sort) {
	case "created_at:asc", "publishedAt:asc":
		return "articles.created_at ASC"
	case "created_at:desc", "publishedAt:desc", "newest":
		return "articles.created_at DESC"
	case "view_count:desc", "viewCount:desc", "popular":
		return "articles.view_count DESC"
	case "title:asc":
		return "articles.title ASC"
	case "title:desc":
		return "articles.title DESC"
	default:
		return "articles.created_at DESC"
	}
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

	originalSlug := art.Slug

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

	s.invalidateArticleCache(originalSlug, art.Slug)

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
	if err := s.repo.Delete(id); err != nil {
		return err
	}

	s.invalidateArticleCache(art.Slug)

	return nil
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

	originalSlug := art.Slug

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

	s.invalidateArticleCache(originalSlug, art.Slug)

	return art, nil
}

func (s *ArticleService) invalidateArticleCache(slugs ...string) {
	if s.articleCache == nil {
		return
	}

	seen := make(map[string]struct{}, len(slugs))
	for _, slug := range slugs {
		if slug == "" {
			continue
		}
		if _, ok := seen[slug]; ok {
			continue
		}
		seen[slug] = struct{}{}

		if err := s.articleCache.InvalidateArticleCache(slug); err != nil {
			logger.Warn("failed to invalidate article cache",
				zap.String("slug", slug),
				zap.Error(err))
		}
	}
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
