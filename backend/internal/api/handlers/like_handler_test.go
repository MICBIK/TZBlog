package handlers

import (
	"encoding/json"
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

func (m *MockLikeRepository) Delete(userID int64, targetType like.TargetType, targetID int64) error {
	args := m.Called(userID, targetType, targetID)
	return args.Error(0)
}

func (m *MockLikeRepository) IsLiked(userID int64, targetType like.TargetType, targetID int64) (bool, error) {
	args := m.Called(userID, targetType, targetID)
	return args.Bool(0), args.Error(1)
}

func (m *MockLikeRepository) CountByTarget(targetType like.TargetType, targetID int64) (int64, error) {
	args := m.Called(targetType, targetID)
	return args.Get(0).(int64), args.Error(1)
}

func TestLikeHandler_LikeArticle(t *testing.T) {
	gin.SetMode(gin.TestMode)

	tests := []struct {
		name           string
		articleID      string
		userID         int64
		mockIsLiked    bool
		mockIsLikedErr error
		mockCreateErr  error
		mockCount      int64
		mockCountErr   error
		expectedStatus int
		expectedLiked  bool
	}{
		{
			name:           "successful like",
			articleID:      "1",
			userID:         123,
			mockIsLiked:    false,
			mockIsLikedErr: nil,
			mockCreateErr:  nil,
			mockCount:      5,
			mockCountErr:   nil,
			expectedStatus: http.StatusOK,
			expectedLiked:  true,
		},
		{
			name:           "already liked",
			articleID:      "1",
			userID:         123,
			mockIsLiked:    true,
			mockIsLikedErr: nil,
			expectedStatus: http.StatusBadRequest,
		},
		{
			name:           "invalid article ID",
			articleID:      "invalid",
			userID:         123,
			expectedStatus: http.StatusBadRequest,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockRepo := new(MockLikeRepository)
			handler := NewLikeHandler(mockRepo)

			if tt.articleID == "1" && tt.name != "already liked" {
				mockRepo.On("IsLiked", tt.userID, like.TargetTypeArticle, int64(1)).Return(tt.mockIsLiked, tt.mockIsLikedErr)
				if !tt.mockIsLiked {
					mockRepo.On("Create", mock.AnythingOfType("*like.Like")).Return(tt.mockCreateErr)
					mockRepo.On("CountByTarget", like.TargetTypeArticle, int64(1)).Return(tt.mockCount, tt.mockCountErr)
				}
			} else if tt.name == "already liked" {
				mockRepo.On("IsLiked", tt.userID, like.TargetTypeArticle, int64(1)).Return(tt.mockIsLiked, tt.mockIsLikedErr)
			}

			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			c.Set("userID", tt.userID)
			c.Params = gin.Params{{Key: "id", Value: tt.articleID}}
			c.Request = httptest.NewRequest(http.MethodPost, "/api/v1/likes/articles/"+tt.articleID, nil)

			handler.LikeArticle(c)

			assert.Equal(t, tt.expectedStatus, w.Code)

			if tt.expectedStatus == http.StatusOK {
				var response map[string]interface{}
				err := json.Unmarshal(w.Body.Bytes(), &response)
				assert.NoError(t, err)

				data := response["data"].(map[string]interface{})
				assert.Equal(t, tt.expectedLiked, data["liked"])
				assert.Equal(t, float64(tt.mockCount), data["count"])
			}

			mockRepo.AssertExpectations(t)
		})
	}
}

func TestLikeHandler_LikeComment(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockRepo := new(MockLikeRepository)
	handler := NewLikeHandler(mockRepo)

	mockRepo.On("IsLiked", int64(123), like.TargetTypeComment, int64(1)).Return(false, nil)
	mockRepo.On("Create", mock.AnythingOfType("*like.Like")).Return(nil)
	mockRepo.On("CountByTarget", like.TargetTypeComment, int64(1)).Return(int64(3), nil)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Set("userID", int64(123))
	c.Params = gin.Params{{Key: "id", Value: "1"}}
	c.Request = httptest.NewRequest(http.MethodPost, "/api/v1/likes/comments/1", nil)

	handler.LikeComment(c)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)

	data := response["data"].(map[string]interface{})
	assert.Equal(t, true, data["liked"])
	assert.Equal(t, float64(3), data["count"])

	mockRepo.AssertExpectations(t)
}

func TestLikeHandler_UnlikeArticle(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockRepo := new(MockLikeRepository)
	handler := NewLikeHandler(mockRepo)

	mockRepo.On("Delete", int64(123), like.TargetTypeArticle, int64(1)).Return(nil)
	mockRepo.On("CountByTarget", like.TargetTypeArticle, int64(1)).Return(int64(4), nil)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Set("userID", int64(123))
	c.Params = gin.Params{{Key: "id", Value: "1"}}
	c.Request = httptest.NewRequest(http.MethodDelete, "/api/v1/likes/articles/1", nil)

	handler.UnlikeArticle(c)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)

	data := response["data"].(map[string]interface{})
	assert.Equal(t, false, data["liked"])
	assert.Equal(t, float64(4), data["count"])

	mockRepo.AssertExpectations(t)
}

func TestLikeHandler_GetLikeStatus(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockRepo := new(MockLikeRepository)
	handler := NewLikeHandler(mockRepo)

	mockRepo.On("IsLiked", int64(123), like.TargetTypeArticle, int64(1)).Return(true, nil)
	mockRepo.On("CountByTarget", like.TargetTypeArticle, int64(1)).Return(int64(10), nil)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Set("userID", int64(123))
	c.Params = gin.Params{{Key: "id", Value: "1"}}
	c.Request = httptest.NewRequest(http.MethodGet, "/api/v1/likes/articles/1/status", nil)

	handler.GetLikeStatus(c)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)

	data := response["data"].(map[string]interface{})
	assert.Equal(t, true, data["liked"])
	assert.Equal(t, float64(10), data["count"])

	mockRepo.AssertExpectations(t)
}
