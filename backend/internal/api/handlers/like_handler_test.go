package handlers

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/MICBIK/TZBlog/backend/internal/domain/like"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockLikeRepository is a mock implementation
type MockLikeRepository struct {
	mock.Mock
}

func (m *MockLikeRepository) Create(l *like.Like) error {
	args := m.Called(l)
	return args.Error(0)
}

func (m *MockLikeRepository) Delete(userID, articleID int64) error {
	args := m.Called(userID, articleID)
	return args.Error(0)
}

func (m *MockLikeRepository) HasLiked(userID, articleID int64) (bool, error) {
	args := m.Called(userID, articleID)
	return args.Bool(0), args.Error(1)
}

func (m *MockLikeRepository) CountByArticle(articleID int64) (int64, error) {
	args := m.Called(articleID)
	return args.Get(0).(int64), args.Error(1)
}

func TestLikeHandler_ToggleLike_Like(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockRepo := new(MockLikeRepository)
	handler := NewLikeHandler(mockRepo)

	mockRepo.On("HasLiked", int64(1), int64(1)).Return(false, nil)
	mockRepo.On("Create", mock.AnythingOfType("*like.Like")).Return(nil)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Set("user_id", int64(1))
	c.Params = gin.Params{{Key: "article_id", Value: "1"}}
	c.Request, _ = http.NewRequest("POST", "/articles/1/like", nil)

	handler.ToggleLike(c)

	assert.Equal(t, http.StatusOK, w.Code)
	mockRepo.AssertExpectations(t)
}

func TestLikeHandler_ToggleLike_Unlike(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockRepo := new(MockLikeRepository)
	handler := NewLikeHandler(mockRepo)

	mockRepo.On("HasLiked", int64(1), int64(1)).Return(true, nil)
	mockRepo.On("Delete", int64(1), int64(1)).Return(nil)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Set("user_id", int64(1))
	c.Params = gin.Params{{Key: "article_id", Value: "1"}}
	c.Request, _ = http.NewRequest("POST", "/articles/1/like", nil)

	handler.ToggleLike(c)

	assert.Equal(t, http.StatusOK, w.Code)
	mockRepo.AssertExpectations(t)
}

func TestLikeHandler_GetLikeCount_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockRepo := new(MockLikeRepository)
	handler := NewLikeHandler(mockRepo)

	mockRepo.On("CountByArticle", int64(1)).Return(int64(42), nil)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Params = gin.Params{{Key: "article_id", Value: "1"}}
	c.Request, _ = http.NewRequest("GET", "/articles/1/likes", nil)

	handler.GetLikeCount(c)

	assert.Equal(t, http.StatusOK, w.Code)
	mockRepo.AssertExpectations(t)
}
