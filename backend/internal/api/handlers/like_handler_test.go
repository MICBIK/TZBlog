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

// MockLikeRepository is a mock implementation of like.LikeRepository
type MockLikeRepository struct {
	mock.Mock
}

func (m *MockLikeRepository) Create(l *like.Like) error {
	args := m.Called(l)
	return args.Error(0)
}

func (m *MockLikeRepository) Delete(articleID, userID int64) error {
	args := m.Called(articleID, userID)
	return args.Error(0)
}

func (m *MockLikeRepository) IsLiked(articleID, userID int64) (bool, error) {
	args := m.Called(articleID, userID)
	return args.Bool(0), args.Error(1)
}

func (m *MockLikeRepository) CountByArticle(articleID int64) (int64, error) {
	args := m.Called(articleID)
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
			// Setup
			mockRepo := new(MockLikeRepository)
			handler := NewLikeHandler(mockRepo)

			// Mock expectations
			if tt.articleID == "1" && tt.name != "already liked" {
				mockRepo.On("IsLiked", int64(1), tt.userID).Return(tt.mockIsLiked, tt.mockIsLikedErr)
				if !tt.mockIsLiked {
					mockRepo.On("Create", mock.AnythingOfType("*like.Like")).Return(tt.mockCreateErr)
					mockRepo.On("CountByArticle", int64(1)).Return(tt.mockCount, tt.mockCountErr)
				}
			} else if tt.name == "already liked" {
				mockRepo.On("IsLiked", int64(1), tt.userID).Return(tt.mockIsLiked, tt.mockIsLikedErr)
			}

			// Create request
			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			c.Set("userID", tt.userID)
			c.Params = gin.Params{{Key: "id", Value: tt.articleID}}
			c.Request = httptest.NewRequest(http.MethodPost, "/api/v1/likes/articles/"+tt.articleID, nil)

			// Execute
			handler.LikeArticle(c)

			// Assert
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

func TestLikeHandler_UnlikeArticle(t *testing.T) {
	gin.SetMode(gin.TestMode)

	tests := []struct {
		name           string
		articleID      string
		userID         int64
		mockDeleteErr  error
		mockCount      int64
		mockCountErr   error
		expectedStatus int
	}{
		{
			name:           "successful unlike",
			articleID:      "1",
			userID:         123,
			mockDeleteErr:  nil,
			mockCount:      4,
			mockCountErr:   nil,
			expectedStatus: http.StatusOK,
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
			// Setup
			mockRepo := new(MockLikeRepository)
			handler := NewLikeHandler(mockRepo)

			// Mock expectations
			if tt.articleID == "1" {
				mockRepo.On("Delete", int64(1), tt.userID).Return(tt.mockDeleteErr)
				mockRepo.On("CountByArticle", int64(1)).Return(tt.mockCount, tt.mockCountErr)
			}

			// Create request
			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			c.Set("userID", tt.userID)
			c.Params = gin.Params{{Key: "id", Value: tt.articleID}}
			c.Request = httptest.NewRequest(http.MethodDelete, "/api/v1/likes/articles/"+tt.articleID, nil)

			// Execute
			handler.UnlikeArticle(c)

			// Assert
			assert.Equal(t, tt.expectedStatus, w.Code)

			if tt.expectedStatus == http.StatusOK {
				var response map[string]interface{}
				err := json.Unmarshal(w.Body.Bytes(), &response)
				assert.NoError(t, err)

				data := response["data"].(map[string]interface{})
				assert.Equal(t, false, data["liked"])
				assert.Equal(t, float64(tt.mockCount), data["count"])
			}

			mockRepo.AssertExpectations(t)
		})
	}
}

func TestLikeHandler_GetLikeStatus(t *testing.T) {
	gin.SetMode(gin.TestMode)

	tests := []struct {
		name            string
		articleID       string
		userID          int64
		mockLiked       bool
		mockLikedErr    error
		mockCount       int64
		mockCountErr    error
		expectedStatus  int
		expectedLiked   bool
		expectedCount   int64
	}{
		{
			name:           "liked status",
			articleID:      "1",
			userID:         123,
			mockLiked:      true,
			mockLikedErr:   nil,
			mockCount:      10,
			mockCountErr:   nil,
			expectedStatus: http.StatusOK,
			expectedLiked:  true,
			expectedCount:  10,
		},
		{
			name:           "not liked status",
			articleID:      "1",
			userID:         123,
			mockLiked:      false,
			mockLikedErr:   nil,
			mockCount:      5,
			mockCountErr:   nil,
			expectedStatus: http.StatusOK,
			expectedLiked:  false,
			expectedCount:  5,
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
			// Setup
			mockRepo := new(MockLikeRepository)
			handler := NewLikeHandler(mockRepo)

			// Mock expectations
			if tt.articleID == "1" {
				mockRepo.On("IsLiked", int64(1), tt.userID).Return(tt.mockLiked, tt.mockLikedErr)
				mockRepo.On("CountByArticle", int64(1)).Return(tt.mockCount, tt.mockCountErr)
			}

			// Create request
			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			c.Set("userID", tt.userID)
			c.Params = gin.Params{{Key: "id", Value: tt.articleID}}
			c.Request = httptest.NewRequest(http.MethodGet, "/api/v1/likes/articles/"+tt.articleID+"/status", nil)

			// Execute
			handler.GetLikeStatus(c)

			// Assert
			assert.Equal(t, tt.expectedStatus, w.Code)

			if tt.expectedStatus == http.StatusOK {
				var response map[string]interface{}
				err := json.Unmarshal(w.Body.Bytes(), &response)
				assert.NoError(t, err)

				data := response["data"].(map[string]interface{})
				assert.Equal(t, tt.expectedLiked, data["liked"])
				assert.Equal(t, float64(tt.expectedCount), data["count"])
			}

			mockRepo.AssertExpectations(t)
		})
	}
}
