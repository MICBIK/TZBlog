package service

import (
	"errors"
	"testing"
	"time"

	internalcache "github.com/MICBIK/TZBlog/backend/internal/cache"
	"github.com/MICBIK/TZBlog/backend/internal/domain/article"
	"github.com/MICBIK/TZBlog/backend/internal/domain/tag"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockArticleRepository is a mock implementation of article.Repository
type MockArticleRepository struct {
	mock.Mock
}

func (m *MockArticleRepository) Create(a *article.Article) error {
	args := m.Called(a)
	return args.Error(0)
}

func (m *MockArticleRepository) FindByID(id int64) (*article.Article, error) {
	args := m.Called(id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*article.Article), args.Error(1)
}

func (m *MockArticleRepository) FindBySlug(slug string) (*article.Article, error) {
	args := m.Called(slug)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*article.Article), args.Error(1)
}

func (m *MockArticleRepository) List(filter *article.ListFilter) ([]*article.Article, int64, error) {
	args := m.Called(filter)
	if args.Get(0) == nil {
		return nil, args.Get(1).(int64), args.Error(2)
	}
	return args.Get(0).([]*article.Article), args.Get(1).(int64), args.Error(2)
}

func (m *MockArticleRepository) Update(a *article.Article) error {
	args := m.Called(a)
	return args.Error(0)
}

func (m *MockArticleRepository) Delete(id int64) error {
	args := m.Called(id)
	return args.Error(0)
}

func (m *MockArticleRepository) IncrementViewCount(id int64) error {
	args := m.Called(id)
	return args.Error(0)
}

func (m *MockArticleRepository) AttachTags(articleID int64, tagIDs []int64) error {
	args := m.Called(articleID, tagIDs)
	return args.Error(0)
}

func (m *MockArticleRepository) DetachTags(articleID int64) error {
	args := m.Called(articleID)
	return args.Error(0)
}

// MockTagRepository is a mock implementation of tag.TagRepository
type MockTagRepository struct {
	mock.Mock
}

type MockArticleCache struct {
	mock.Mock
}

func (m *MockArticleCache) GetArticleBySlug(slug string, dest interface{}) error {
	args := m.Called(slug)
	if cached, ok := args.Get(0).(*article.Article); ok && cached != nil {
		switch target := dest.(type) {
		case *article.Article:
			*target = *cached
		}
	}
	return args.Error(1)
}

func (m *MockArticleCache) SetArticle(slug string, art interface{}) error {
	args := m.Called(slug, art)
	return args.Error(0)
}

func (m *MockArticleCache) InvalidateArticleCache(slug string) error {
	args := m.Called(slug)
	return args.Error(0)
}

func (m *MockTagRepository) Create(t *tag.Tag) error {
	args := m.Called(t)
	return args.Error(0)
}

func (m *MockTagRepository) FindByID(id int64) (*tag.Tag, error) {
	args := m.Called(id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*tag.Tag), args.Error(1)
}

func (m *MockTagRepository) FindBySlug(slug string) (*tag.Tag, error) {
	args := m.Called(slug)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*tag.Tag), args.Error(1)
}

func (m *MockTagRepository) List(limit, offset int) ([]*tag.Tag, int64, error) {
	args := m.Called(limit, offset)
	return args.Get(0).([]*tag.Tag), args.Get(1).(int64), args.Error(2)
}

func (m *MockTagRepository) Update(t *tag.Tag) error {
	args := m.Called(t)
	return args.Error(0)
}

func (m *MockTagRepository) Delete(id int64) error {
	args := m.Called(id)
	return args.Error(0)
}

func (m *MockTagRepository) FindByNames(names []string) ([]*tag.Tag, error) {
	args := m.Called(names)
	if args.Get(0) == nil {
		return []*tag.Tag{}, args.Error(1)
	}
	return args.Get(0).([]*tag.Tag), args.Error(1)
}

func (m *MockTagRepository) FindByArticleID(articleID int64) ([]*tag.Tag, error) {
	args := m.Called(articleID)
	if args.Get(0) == nil {
		return []*tag.Tag{}, args.Error(1)
	}
	return args.Get(0).([]*tag.Tag), args.Error(1)
}

// TestCreateArticle_Success tests successful article creation
func TestCreateArticle_Success(t *testing.T) {
	// Arrange
	mockRepo := new(MockArticleRepository)
	mockTagRepo := new(MockTagRepository)
	service := NewArticleService(mockRepo, mockTagRepo)

	dto := &article.CreateArticleDTO{
		Title:   "Test Article",
		Summary: "Test summary",
		Content: "This is test content for the article.",
		Status:  article.StatusDraft,
	}

	mockRepo.On("Create", mock.AnythingOfType("*article.Article")).Return(nil)

	// Act
	result, err := service.CreateArticle(1, dto)

	// Assert
	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, "Test Article", result.Title)
	assert.Equal(t, "test-article", result.Slug)
	assert.Equal(t, int64(1), result.AuthorID)
	assert.Greater(t, result.ReadingTime, 0)
	mockRepo.AssertExpectations(t)
}

// TestCreateArticle_Published tests article creation with published status
func TestCreateArticle_Published(t *testing.T) {
	// Arrange
	mockRepo := new(MockArticleRepository)
	mockTagRepo := new(MockTagRepository)
	service := NewArticleService(mockRepo, mockTagRepo)

	dto := &article.CreateArticleDTO{
		Title:   "Published Article",
		Content: "Content for published article.",
		Status:  article.StatusPublished,
	}

	mockRepo.On("Create", mock.AnythingOfType("*article.Article")).Return(nil)

	// Act
	result, err := service.CreateArticle(1, dto)

	// Assert
	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.NotNil(t, result.PublishedAt)
	mockRepo.AssertExpectations(t)
}

// TestGetArticleByID_Success tests successful retrieval by ID
func TestGetArticleByID_Success(t *testing.T) {
	// Arrange
	mockRepo := new(MockArticleRepository)
	mockTagRepo := new(MockTagRepository)
	service := NewArticleService(mockRepo, mockTagRepo)

	expected := &article.Article{
		ID:    1,
		Title: "Test Article",
		Slug:  "test-article",
	}

	mockRepo.On("FindByID", int64(1)).Return(expected, nil)

	// Act
	result, err := service.GetArticleByID(1)

	// Assert
	assert.NoError(t, err)
	assert.Equal(t, expected, result)
	mockRepo.AssertExpectations(t)
}

// TestGetArticleByID_NotFound tests article not found scenario
func TestGetArticleByID_NotFound(t *testing.T) {
	// Arrange
	mockRepo := new(MockArticleRepository)
	mockTagRepo := new(MockTagRepository)
	service := NewArticleService(mockRepo, mockTagRepo)

	mockRepo.On("FindByID", int64(999)).Return(nil, nil)

	// Act
	result, err := service.GetArticleByID(999)

	// Assert
	assert.Error(t, err)
	assert.Equal(t, article.ErrArticleNotFound, err)
	assert.Nil(t, result)
	mockRepo.AssertExpectations(t)
}

// TestGetArticleBySlug_Success tests successful retrieval by slug
func TestGetArticleBySlug_Success(t *testing.T) {
	// Arrange
	mockRepo := new(MockArticleRepository)
	mockTagRepo := new(MockTagRepository)
	service := NewArticleService(mockRepo, mockTagRepo)

	expected := &article.Article{
		ID:    1,
		Title: "Test Article",
		Slug:  "test-article",
	}

	mockRepo.On("FindBySlug", "test-article").Return(expected, nil)
	mockRepo.On("IncrementViewCount", int64(1)).Return(nil)

	// Act
	result, err := service.GetArticleBySlug("test-article")

	// Assert
	assert.NoError(t, err)
	assert.Equal(t, expected, result)

	// Wait a bit for async increment (best effort)
	time.Sleep(10 * time.Millisecond)
	mockRepo.AssertExpectations(t)
}

func TestGetArticleBySlug_CacheHit(t *testing.T) {
	mockRepo := new(MockArticleRepository)
	mockTagRepo := new(MockTagRepository)
	mockCache := new(MockArticleCache)
	service := NewArticleService(mockRepo, mockTagRepo).(*ArticleService)
	service.SetArticleCache(mockCache)

	cachedArticle := &article.Article{
		ID:    10,
		Title: "Cached Article",
		Slug:  "cached-article",
	}

	mockCache.On("GetArticleBySlug", "cached-article").Return(cachedArticle, nil)
	mockRepo.On("IncrementViewCount", int64(10)).Return(nil)
	mockCache.On("InvalidateArticleCache", "cached-article").Return(nil)

	result, err := service.GetArticleBySlug("cached-article")

	assert.NoError(t, err)
	assert.Equal(t, cachedArticle.Title, result.Title)
	time.Sleep(10 * time.Millisecond)
	mockCache.AssertExpectations(t)
	mockRepo.AssertExpectations(t)
}

func TestGetArticleBySlug_CacheMissFallsBackToRepo(t *testing.T) {
	mockRepo := new(MockArticleRepository)
	mockTagRepo := new(MockTagRepository)
	mockCache := new(MockArticleCache)
	service := NewArticleService(mockRepo, mockTagRepo).(*ArticleService)
	service.SetArticleCache(mockCache)

	expected := &article.Article{
		ID:    11,
		Title: "Repo Article",
		Slug:  "repo-article",
	}

	mockCache.On("GetArticleBySlug", "repo-article").Return((*article.Article)(nil), internalcache.ErrCacheMiss)
	mockRepo.On("FindBySlug", "repo-article").Return(expected, nil)
	mockCache.On("SetArticle", "repo-article", expected).Return(nil)
	mockRepo.On("IncrementViewCount", int64(11)).Return(nil)
	mockCache.On("InvalidateArticleCache", "repo-article").Return(nil)

	result, err := service.GetArticleBySlug("repo-article")

	assert.NoError(t, err)
	assert.Equal(t, expected, result)
	time.Sleep(10 * time.Millisecond)
	mockCache.AssertExpectations(t)
	mockRepo.AssertExpectations(t)
}

func TestGetArticleBySlug_CacheReadErrorFallsBackToRepo(t *testing.T) {
	mockRepo := new(MockArticleRepository)
	mockTagRepo := new(MockTagRepository)
	mockCache := new(MockArticleCache)
	service := NewArticleService(mockRepo, mockTagRepo).(*ArticleService)
	service.SetArticleCache(mockCache)

	expected := &article.Article{
		ID:    12,
		Title: "Repo Article",
		Slug:  "repo-article",
	}

	mockCache.On("GetArticleBySlug", "repo-article").Return((*article.Article)(nil), errors.New("redis down"))
	mockRepo.On("FindBySlug", "repo-article").Return(expected, nil)
	mockCache.On("SetArticle", "repo-article", expected).Return(nil)
	mockRepo.On("IncrementViewCount", int64(12)).Return(nil)
	mockCache.On("InvalidateArticleCache", "repo-article").Return(nil)

	result, err := service.GetArticleBySlug("repo-article")

	assert.NoError(t, err)
	assert.Equal(t, expected, result)
	time.Sleep(10 * time.Millisecond)
	mockCache.AssertExpectations(t)
	mockRepo.AssertExpectations(t)
}

// TestListArticles_Success tests successful article listing
func TestListArticles_Success(t *testing.T) {
	// Arrange
	mockRepo := new(MockArticleRepository)
	mockTagRepo := new(MockTagRepository)
	service := NewArticleService(mockRepo, mockTagRepo)

	filter := &article.ListFilter{
		Page:  1,
		Limit: 10,
	}

	expectedArticles := []*article.Article{
		{ID: 1, Title: "Article 1"},
		{ID: 2, Title: "Article 2"},
	}

	mockRepo.On("List", mock.AnythingOfType("*article.ListFilter")).Return(expectedArticles, int64(2), nil)

	// Act
	articles, total, err := service.ListArticles(filter)

	// Assert
	assert.NoError(t, err)
	assert.Equal(t, expectedArticles, articles)
	assert.Equal(t, int64(2), total)
	mockRepo.AssertExpectations(t)
}

// TestListArticles_DefaultPagination tests default pagination values
func TestListArticles_DefaultPagination(t *testing.T) {
	// Arrange
	mockRepo := new(MockArticleRepository)
	mockTagRepo := new(MockTagRepository)
	service := NewArticleService(mockRepo, mockTagRepo)

	filter := &article.ListFilter{}

	mockRepo.On("List", mock.MatchedBy(func(f *article.ListFilter) bool {
		return f.Limit == 10 && f.Page == 1
	})).Return([]*article.Article{}, int64(0), nil)

	// Act
	_, _, err := service.ListArticles(filter)

	// Assert
	assert.NoError(t, err)
	assert.Equal(t, 10, filter.Limit)
	assert.Equal(t, 1, filter.Page)
	mockRepo.AssertExpectations(t)
}

// TestUpdateArticle_Success tests successful article update
func TestUpdateArticle_Success(t *testing.T) {
	// Arrange
	mockRepo := new(MockArticleRepository)
	mockTagRepo := new(MockTagRepository)
	service := NewArticleService(mockRepo, mockTagRepo).(*ArticleService)
	mockCache := new(MockArticleCache)
	service.SetArticleCache(mockCache)

	existingArticle := &article.Article{
		ID:       1,
		AuthorID: 1,
		Title:    "Old Title",
		Content:  "Old content",
		Status:   article.StatusDraft,
		Slug:     "old-title",
	}

	newTitle := "New Title"
	dto := &article.UpdateArticleDTO{
		Title: &newTitle,
	}

	mockRepo.On("FindByID", int64(1)).Return(existingArticle, nil)
	mockRepo.On("Update", mock.AnythingOfType("*article.Article")).Return(nil)
	mockCache.On("InvalidateArticleCache", "old-title").Return(nil)
	mockCache.On("InvalidateArticleCache", "new-title").Return(nil)

	// Act
	result, err := service.UpdateArticle(1, 1, dto)

	// Assert
	assert.NoError(t, err)
	assert.Equal(t, "New Title", result.Title)
	mockRepo.AssertExpectations(t)
	mockCache.AssertExpectations(t)
}

// TestUpdateArticle_Unauthorized tests unauthorized update attempt
func TestUpdateArticle_Unauthorized(t *testing.T) {
	// Arrange
	mockRepo := new(MockArticleRepository)
	mockTagRepo := new(MockTagRepository)
	service := NewArticleService(mockRepo, mockTagRepo)

	existingArticle := &article.Article{
		ID:       1,
		AuthorID: 1,
		Title:    "Title",
		Content:  "Content",
	}

	newTitle := "New Title"
	dto := &article.UpdateArticleDTO{
		Title: &newTitle,
	}

	mockRepo.On("FindByID", int64(1)).Return(existingArticle, nil)

	// Act
	result, err := service.UpdateArticle(1, 2, dto) // Different user ID

	// Assert
	assert.Error(t, err)
	assert.Equal(t, article.ErrUnauthorized, err)
	assert.Nil(t, result)
	mockRepo.AssertExpectations(t)
}

// TestDeleteArticle_Success tests successful article deletion
func TestDeleteArticle_Success(t *testing.T) {
	// Arrange
	mockRepo := new(MockArticleRepository)
	mockTagRepo := new(MockTagRepository)
	service := NewArticleService(mockRepo, mockTagRepo).(*ArticleService)
	mockCache := new(MockArticleCache)
	service.SetArticleCache(mockCache)

	existingArticle := &article.Article{
		ID:       1,
		AuthorID: 1,
		Slug:     "test-article",
	}

	mockRepo.On("FindByID", int64(1)).Return(existingArticle, nil)
	mockRepo.On("Delete", int64(1)).Return(nil)
	mockCache.On("InvalidateArticleCache", "test-article").Return(nil)

	// Act
	err := service.DeleteArticle(1, 1)

	// Assert
	assert.NoError(t, err)
	mockRepo.AssertExpectations(t)
	mockCache.AssertExpectations(t)
}

// TestDeleteArticle_Unauthorized tests unauthorized delete attempt
func TestDeleteArticle_Unauthorized(t *testing.T) {
	// Arrange
	mockRepo := new(MockArticleRepository)
	mockTagRepo := new(MockTagRepository)
	service := NewArticleService(mockRepo, mockTagRepo)

	existingArticle := &article.Article{
		ID:       1,
		AuthorID: 1,
	}

	mockRepo.On("FindByID", int64(1)).Return(existingArticle, nil)

	// Act
	err := service.DeleteArticle(1, 2) // Different user ID

	// Assert
	assert.Error(t, err)
	assert.Equal(t, article.ErrUnauthorized, err)
	mockRepo.AssertExpectations(t)
}
