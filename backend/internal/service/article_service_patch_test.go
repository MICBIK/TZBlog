package service

import (
	"testing"
	"time"

	"github.com/MICBIK/TZBlog/backend/internal/domain/article"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func TestPatchArticle(t *testing.T) {
	mockRepo := new(MockArticleRepository)
	mockTagRepo := new(MockTagRepository)
	mockCache := new(MockArticleCache)
	service := NewArticleService(mockRepo, mockTagRepo).(*ArticleService)
	service.SetArticleCache(mockCache)

	now := time.Now()
	existingArticle := &article.Article{
		ID:        1,
		AuthorID:  100,
		Title:     "Original Title",
		Content:   "Original Content",
		Status:    article.StatusDraft,
		Slug:      "original-title",
		CreatedAt: now,
		UpdatedAt: now,
	}

	t.Run("successful patch", func(t *testing.T) {
		mockRepo.On("FindBySlug", "original-title").Return(existingArticle, nil).Once()
		mockRepo.On("Update", mock.Anything).Return(nil).Once()
		mockCache.On("InvalidateArticleCache", "original-title").Return(nil).Once()
		mockCache.On("InvalidateArticleCache", "new-title").Return(nil).Once()

		updates := map[string]interface{}{
			"title":  "New Title",
			"status": article.StatusPublished,
		}

		result, err := service.PatchArticle("original-title", 100, updates)

		assert.NoError(t, err)
		assert.NotNil(t, result)
		assert.Equal(t, "New Title", result.Title)
		assert.Equal(t, article.StatusPublished, result.Status)
		assert.NotNil(t, result.PublishedAt)
		mockRepo.AssertExpectations(t)
		mockCache.AssertExpectations(t)
	})

	t.Run("unauthorized patch", func(t *testing.T) {
		mockRepo.On("FindBySlug", "original-title").Return(existingArticle, nil).Once()

		updates := map[string]interface{}{
			"title": "New Title",
		}

		result, err := service.PatchArticle("original-title", 999, updates)

		assert.Error(t, err)
		assert.Nil(t, result)
		assert.Equal(t, article.ErrUnauthorized, err)
		mockRepo.AssertExpectations(t)
	})

	t.Run("article not found", func(t *testing.T) {
		mockRepo.On("FindBySlug", "nonexistent").Return(nil, nil).Once()

		updates := map[string]interface{}{
			"title": "New Title",
		}

		result, err := service.PatchArticle("nonexistent", 100, updates)

		assert.Error(t, err)
		assert.Nil(t, result)
		assert.Equal(t, article.ErrArticleNotFound, err)
		mockRepo.AssertExpectations(t)
	})
}

func TestBatchDelete(t *testing.T) {
	mockRepo := new(MockArticleRepository)
	mockTagRepo := new(MockTagRepository)
	service := NewArticleService(mockRepo, mockTagRepo)

	t.Run("successful batch delete", func(t *testing.T) {
		ids := []int64{1, 2, 3}
		userID := int64(100)

		for _, id := range ids {
			art := &article.Article{
				ID:       id,
				AuthorID: userID,
				Title:    "Test Article",
				Content:  "Content",
			}
			mockRepo.On("FindByID", id).Return(art, nil).Once()
			mockRepo.On("Delete", id).Return(nil).Once()
		}

		count, err := service.BatchDelete(ids, userID)

		assert.NoError(t, err)
		assert.Equal(t, 3, count)
		mockRepo.AssertExpectations(t)
	})

	t.Run("empty batch", func(t *testing.T) {
		count, err := service.BatchDelete([]int64{}, 100)

		assert.NoError(t, err)
		assert.Equal(t, 0, count)
	})

	t.Run("exceeds max batch size", func(t *testing.T) {
		ids := make([]int64, 101)
		for i := range ids {
			ids[i] = int64(i + 1)
		}

		count, err := service.BatchDelete(ids, 100)

		assert.Error(t, err)
		assert.Equal(t, 0, count)
		assert.Equal(t, article.ErrInvalidInput, err)
	})

	t.Run("skips unauthorized articles", func(t *testing.T) {
		ids := []int64{1, 2, 3}
		userID := int64(100)

		// Article 1: owned by user (will be deleted)
		art1 := &article.Article{
			ID:       1,
			AuthorID: userID,
			Title:    "Test Article 1",
			Content:  "Content 1",
		}
		mockRepo.On("FindByID", int64(1)).Return(art1, nil).Once()
		mockRepo.On("Delete", int64(1)).Return(nil).Once()

		// Article 2: owned by another user (will be skipped)
		art2 := &article.Article{
			ID:       2,
			AuthorID: 999,
			Title:    "Test Article 2",
			Content:  "Content 2",
		}
		mockRepo.On("FindByID", int64(2)).Return(art2, nil).Once()

		// Article 3: owned by user (will be deleted)
		art3 := &article.Article{
			ID:       3,
			AuthorID: userID,
			Title:    "Test Article 3",
			Content:  "Content 3",
		}
		mockRepo.On("FindByID", int64(3)).Return(art3, nil).Once()
		mockRepo.On("Delete", int64(3)).Return(nil).Once()

		count, err := service.BatchDelete(ids, userID)

		assert.NoError(t, err)
		assert.Equal(t, 2, count)
		mockRepo.AssertExpectations(t)
	})
}

func TestBatchUpdateStatus(t *testing.T) {
	mockRepo := new(MockArticleRepository)
	mockTagRepo := new(MockTagRepository)
	service := NewArticleService(mockRepo, mockTagRepo)

	t.Run("successful batch update status", func(t *testing.T) {
		ids := []int64{1, 2}
		userID := int64(100)

		for _, id := range ids {
			art := &article.Article{
				ID:       id,
				AuthorID: userID,
				Title:    "Test Article",
				Content:  "Content",
				Status:   article.StatusDraft,
			}
			mockRepo.On("FindByID", id).Return(art, nil).Once()
			mockRepo.On("Update", mock.Anything).Return(nil).Once()
		}

		count, err := service.BatchUpdateStatus(ids, userID, article.StatusPublished)

		assert.NoError(t, err)
		assert.Equal(t, 2, count)
		mockRepo.AssertExpectations(t)
	})

	t.Run("invalid status", func(t *testing.T) {
		ids := []int64{1, 2}

		count, err := service.BatchUpdateStatus(ids, 100, "invalid_status")

		assert.Error(t, err)
		assert.Equal(t, 0, count)
		assert.Equal(t, article.ErrInvalidInput, err)
	})

	t.Run("empty batch", func(t *testing.T) {
		count, err := service.BatchUpdateStatus([]int64{}, 100, article.StatusPublished)

		assert.NoError(t, err)
		assert.Equal(t, 0, count)
	})

	t.Run("exceeds max batch size", func(t *testing.T) {
		ids := make([]int64, 101)
		for i := range ids {
			ids[i] = int64(i + 1)
		}

		count, err := service.BatchUpdateStatus(ids, 100, article.StatusPublished)

		assert.Error(t, err)
		assert.Equal(t, 0, count)
		assert.Equal(t, article.ErrInvalidInput, err)
	})
}
