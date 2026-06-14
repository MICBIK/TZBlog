package service

import (
	"testing"
	"time"

	"github.com/MICBIK/TZBlog/backend/internal/domain/article"
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

// TestCreateArticle_Success tests successful article creation
func TestCreateArticle_Success(t *testing.T) {
	// Arrange
	mockRepo := new(MockArticleRepository)
	service := NewArticleService(mockRepo)

	dto := &CreateArticleDTO{
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
	service := NewArticleService(mockRepo)

	dto := &CreateArticleDTO{
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
	service := NewArticleService(mockRepo)

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
	service := NewArticleService(mockRepo)

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
	service := NewArticleService(mockRepo)

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

// TestListArticles_Success tests successful article listing
func TestListArticles_Success(t *testing.T) {
	// Arrange
	mockRepo := new(MockArticleRepository)
	service := NewArticleService(mockRepo)

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
	service := NewArticleService(mockRepo)

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
	service := NewArticleService(mockRepo)

	existingArticle := &article.Article{
		ID:       1,
		AuthorID: 1,
		Title:    "Old Title",
		Content:  "Old content",
		Status:   article.StatusDraft,
	}

	newTitle := "New Title"
	dto := &UpdateArticleDTO{
		Title: &newTitle,
	}

	mockRepo.On("FindByID", int64(1)).Return(existingArticle, nil)
	mockRepo.On("Update", mock.AnythingOfType("*article.Article")).Return(nil)

	// Act
	result, err := service.UpdateArticle(1, 1, dto)

	// Assert
	assert.NoError(t, err)
	assert.Equal(t, "New Title", result.Title)
	mockRepo.AssertExpectations(t)
}

// TestUpdateArticle_Unauthorized tests unauthorized update attempt
func TestUpdateArticle_Unauthorized(t *testing.T) {
	// Arrange
	mockRepo := new(MockArticleRepository)
	service := NewArticleService(mockRepo)

	existingArticle := &article.Article{
		ID:       1,
		AuthorID: 1,
		Title:    "Title",
		Content:  "Content",
	}

	newTitle := "New Title"
	dto := &UpdateArticleDTO{
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
	service := NewArticleService(mockRepo)

	existingArticle := &article.Article{
		ID:       1,
		AuthorID: 1,
	}

	mockRepo.On("FindByID", int64(1)).Return(existingArticle, nil)
	mockRepo.On("Delete", int64(1)).Return(nil)

	// Act
	err := service.DeleteArticle(1, 1)

	// Assert
	assert.NoError(t, err)
	mockRepo.AssertExpectations(t)
}

// TestDeleteArticle_Unauthorized tests unauthorized delete attempt
func TestDeleteArticle_Unauthorized(t *testing.T) {
	// Arrange
	mockRepo := new(MockArticleRepository)
	service := NewArticleService(mockRepo)

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
