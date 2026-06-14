package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/MICBIK/TZBlog/backend/internal/domain/comment"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockCommentRepository is a mock implementation
type MockCommentRepository struct {
	mock.Mock
}

func (m *MockCommentRepository) Create(c *comment.Comment) error {
	args := m.Called(c)
	return args.Error(0)
}

func (m *MockCommentRepository) FindByID(id int64) (*comment.Comment, error) {
	args := m.Called(id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*comment.Comment), args.Error(1)
}

func (m *MockCommentRepository) FindByArticleID(articleID int64) ([]*comment.Comment, error) {
	args := m.Called(articleID)
	return args.Get(0).([]*comment.Comment), args.Error(1)
}

func (m *MockCommentRepository) Update(c *comment.Comment) error {
	args := m.Called(c)
	return args.Error(0)
}

func (m *MockCommentRepository) Delete(id int64) error {
	args := m.Called(id)
	return args.Error(0)
}

func TestCommentHandler_CreateComment_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockRepo := new(MockCommentRepository)
	handler := NewCommentHandler(mockRepo)

	mockRepo.On("Create", mock.AnythingOfType("*comment.Comment")).Return(nil)

	reqBody := map[string]interface{}{
		"article_id": 1,
		"content":    "Test comment",
	}
	body, _ := json.Marshal(reqBody)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Set("user_id", int64(1))
	c.Request, _ = http.NewRequest("POST", "/comments", bytes.NewBuffer(body))
	c.Request.Header.Set("Content-Type", "application/json")

	handler.CreateComment(c)

	assert.Equal(t, http.StatusCreated, w.Code)
	mockRepo.AssertExpectations(t)
}

func TestCommentHandler_GetCommentsByArticle_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockRepo := new(MockCommentRepository)
	handler := NewCommentHandler(mockRepo)

	comments := []*comment.Comment{
		{ID: 1, ArticleID: 1, Content: "Comment 1"},
		{ID: 2, ArticleID: 1, Content: "Comment 2"},
	}

	mockRepo.On("FindByArticleID", int64(1)).Return(comments, nil)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Params = gin.Params{{Key: "article_id", Value: "1"}}
	c.Request, _ = http.NewRequest("GET", "/articles/1/comments", nil)

	handler.GetCommentsByArticle(c)

	assert.Equal(t, http.StatusOK, w.Code)
	mockRepo.AssertExpectations(t)
}

func TestCommentHandler_DeleteComment_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockRepo := new(MockCommentRepository)
	handler := NewCommentHandler(mockRepo)

	existingComment := &comment.Comment{
		ID:     1,
		UserID: 1,
	}

	mockRepo.On("FindByID", int64(1)).Return(existingComment, nil)
	mockRepo.On("Delete", int64(1)).Return(nil)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Set("user_id", int64(1))
	c.Params = gin.Params{{Key: "id", Value: "1"}}
	c.Request, _ = http.NewRequest("DELETE", "/comments/1", nil)

	handler.DeleteComment(c)

	assert.Equal(t, http.StatusOK, w.Code)
	mockRepo.AssertExpectations(t)
}

func TestCommentHandler_DeleteComment_Forbidden(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockRepo := new(MockCommentRepository)
	handler := NewCommentHandler(mockRepo)

	existingComment := &comment.Comment{
		ID:     1,
		UserID: 2, // Different user
	}

	mockRepo.On("FindByID", int64(1)).Return(existingComment, nil)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Set("user_id", int64(1))
	c.Params = gin.Params{{Key: "id", Value: "1"}}
	c.Request, _ = http.NewRequest("DELETE", "/comments/1", nil)

	handler.DeleteComment(c)

	assert.Equal(t, http.StatusForbidden, w.Code)
	mockRepo.AssertExpectations(t)
}
