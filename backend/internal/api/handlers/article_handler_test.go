package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/MICBIK/TZBlog/backend/internal/domain/article"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockArticleRepository is a mock implementation
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

func TestArticleHandler_GetArticleBySlug_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockRepo := new(MockArticleRepository)
	handler := NewArticleHandler(mockRepo)

	testArticle := &article.Article{
		ID:      1,
		Title:   "Test Article",
		Slug:    "test-article",
		Content: "Test content",
		Status:  "published",
	}

	mockRepo.On("FindBySlug", "test-article").Return(testArticle, nil)
	mockRepo.On("IncrementViewCount", int64(1)).Return(nil)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Params = gin.Params{{Key: "slug", Value: "test-article"}}
	c.Request, _ = http.NewRequest("GET", "/articles/test-article", nil)

	handler.GetArticleBySlug(c)

	assert.Equal(t, http.StatusOK, w.Code)
	mockRepo.AssertExpectations(t)
}

func TestArticleHandler_GetArticleBySlug_NotFound(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockRepo := new(MockArticleRepository)
	handler := NewArticleHandler(mockRepo)

	mockRepo.On("FindBySlug", "nonexistent").Return(nil, nil)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Params = gin.Params{{Key: "slug", Value: "nonexistent"}}
	c.Request, _ = http.NewRequest("GET", "/articles/nonexistent", nil)

	handler.GetArticleBySlug(c)

	assert.Equal(t, http.StatusNotFound, w.Code)
	mockRepo.AssertExpectations(t)
}

func TestArticleHandler_ListArticles_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockRepo := new(MockArticleRepository)
	handler := NewArticleHandler(mockRepo)

	articles := []*article.Article{
		{ID: 1, Title: "Article 1", Slug: "article-1"},
		{ID: 2, Title: "Article 2", Slug: "article-2"},
	}

	mockRepo.On("List", mock.AnythingOfType("*article.ListFilter")).Return(articles, int64(2), nil)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("GET", "/articles?page=1&limit=10", nil)

	handler.ListArticles(c)

	assert.Equal(t, http.StatusOK, w.Code)
	mockRepo.AssertExpectations(t)
}

func TestArticleHandler_CreateArticle_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockRepo := new(MockArticleRepository)
	handler := NewArticleHandler(mockRepo)

	mockRepo.On("Create", mock.AnythingOfType("*article.Article")).Return(nil)

	reqBody := map[string]interface{}{
		"title":   "New Article",
		"content": "Article content",
		"status":  "draft",
	}
	body, _ := json.Marshal(reqBody)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Set("user_id", int64(1))
	c.Request, _ = http.NewRequest("POST", "/articles", bytes.NewBuffer(body))
	c.Request.Header.Set("Content-Type", "application/json")

	handler.CreateArticle(c)

	assert.Equal(t, http.StatusCreated, w.Code)
	mockRepo.AssertExpectations(t)
}

func TestArticleHandler_UpdateArticle_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockRepo := new(MockArticleRepository)
	handler := NewArticleHandler(mockRepo)

	existingArticle := &article.Article{
		ID:       1,
		AuthorID: 1,
		Title:    "Old Title",
		Content:  "Old content",
	}

	mockRepo.On("FindByID", int64(1)).Return(existingArticle, nil)
	mockRepo.On("Update", mock.AnythingOfType("*article.Article")).Return(nil)

	reqBody := map[string]interface{}{
		"title":   "Updated Title",
		"content": "Updated content",
	}
	body, _ := json.Marshal(reqBody)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Set("user_id", int64(1))
	c.Params = gin.Params{{Key: "id", Value: "1"}}
	c.Request, _ = http.NewRequest("PUT", "/articles/1", bytes.NewBuffer(body))
	c.Request.Header.Set("Content-Type", "application/json")

	handler.UpdateArticle(c)

	assert.Equal(t, http.StatusOK, w.Code)
	mockRepo.AssertExpectations(t)
}

func TestArticleHandler_DeleteArticle_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockRepo := new(MockArticleRepository)
	handler := NewArticleHandler(mockRepo)

	existingArticle := &article.Article{
		ID:       1,
		AuthorID: 1,
	}

	mockRepo.On("FindByID", int64(1)).Return(existingArticle, nil)
	mockRepo.On("Delete", int64(1)).Return(nil)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Set("user_id", int64(1))
	c.Params = gin.Params{{Key: "id", Value: "1"}}
	c.Request, _ = http.NewRequest("DELETE", "/articles/1", nil)

	handler.DeleteArticle(c)

	assert.Equal(t, http.StatusOK, w.Code)
	mockRepo.AssertExpectations(t)
}

func TestArticleHandler_DeleteArticle_Forbidden(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockRepo := new(MockArticleRepository)
	handler := NewArticleHandler(mockRepo)

	existingArticle := &article.Article{
		ID:       1,
		AuthorID: 2, // Different author
	}

	mockRepo.On("FindByID", int64(1)).Return(existingArticle, nil)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Set("user_id", int64(1))
	c.Params = gin.Params{{Key: "id", Value: "1"}}
	c.Request, _ = http.NewRequest("DELETE", "/articles/1", nil)

	handler.DeleteArticle(c)

	assert.Equal(t, http.StatusForbidden, w.Code)
	mockRepo.AssertExpectations(t)
}
