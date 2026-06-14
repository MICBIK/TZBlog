package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/MICBIK/TZBlog/backend/internal/domain/user"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockFollowRepository is a mock implementation of follow.FollowRepository
type MockFollowRepository struct {
	mock.Mock
}

func (m *MockFollowRepository) Follow(followerID, followingID int64) error {
	args := m.Called(followerID, followingID)
	return args.Error(0)
}

func (m *MockFollowRepository) Unfollow(followerID, followingID int64) error {
	args := m.Called(followerID, followingID)
	return args.Error(0)
}

func (m *MockFollowRepository) IsFollowing(followerID, followingID int64) (bool, error) {
	args := m.Called(followerID, followingID)
	return args.Bool(0), args.Error(1)
}

func (m *MockFollowRepository) GetFollowers(userID int64, limit, offset int) ([]*user.User, int64, error) {
	args := m.Called(userID, limit, offset)
	if args.Get(0) == nil {
		return nil, args.Get(1).(int64), args.Error(2)
	}
	return args.Get(0).([]*user.User), args.Get(1).(int64), args.Error(2)
}

func (m *MockFollowRepository) GetFollowing(userID int64, limit, offset int) ([]*user.User, int64, error) {
	args := m.Called(userID, limit, offset)
	if args.Get(0) == nil {
		return nil, args.Get(1).(int64), args.Error(2)
	}
	return args.Get(0).([]*user.User), args.Get(1).(int64), args.Error(2)
}

func (m *MockFollowRepository) GetFollowerCount(userID int64) (int64, error) {
	args := m.Called(userID)
	return args.Get(0).(int64), args.Error(1)
}

func (m *MockFollowRepository) GetFollowingCount(userID int64) (int64, error) {
	args := m.Called(userID)
	return args.Get(0).(int64), args.Error(1)
}

func TestFollowHandler_Follow(t *testing.T) {
	gin.SetMode(gin.TestMode)

	tests := []struct {
		name           string
		followerID     int64
		targetID       string
		mockError      error
		expectedStatus int
	}{
		{
			name:           "successful follow",
			followerID:     123,
			targetID:       "456",
			mockError:      nil,
			expectedStatus: http.StatusOK,
		},
		{
			name:           "invalid user ID",
			followerID:     123,
			targetID:       "invalid",
			mockError:      nil,
			expectedStatus: http.StatusBadRequest,
		},
		{
			name:           "cannot follow self",
			followerID:     123,
			targetID:       "123",
			mockError:      nil,
			expectedStatus: http.StatusBadRequest,
		},
		{
			name:           "service error",
			followerID:     123,
			targetID:       "456",
			mockError:      errors.New("database error"),
			expectedStatus: http.StatusInternalServerError,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Arrange
			mockRepo := new(MockFollowRepository)
			handler := NewFollowHandler(mockRepo)

			if tt.targetID == "456" {
				mockRepo.On("Follow", tt.followerID, int64(456)).Return(tt.mockError)
			}

			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			c.Set("user_id", tt.followerID)
			c.Params = gin.Params{{Key: "id", Value: tt.targetID}}
			c.Request = httptest.NewRequest(http.MethodPost, "/api/v1/users/"+tt.targetID+"/follow", nil)

			// Act
			handler.Follow(c)

			// Assert
			assert.Equal(t, tt.expectedStatus, w.Code)

			if tt.expectedStatus == http.StatusOK {
				var response map[string]interface{}
				err := json.Unmarshal(w.Body.Bytes(), &response)
				assert.NoError(t, err)
				assert.True(t, response["success"].(bool))
			}

			mockRepo.AssertExpectations(t)
		})
	}
}

func TestFollowHandler_Unfollow(t *testing.T) {
	gin.SetMode(gin.TestMode)

	tests := []struct {
		name           string
		followerID     int64
		targetID       string
		mockError      error
		expectedStatus int
	}{
		{
			name:           "successful unfollow",
			followerID:     123,
			targetID:       "456",
			mockError:      nil,
			expectedStatus: http.StatusOK,
		},
		{
			name:           "invalid user ID",
			followerID:     123,
			targetID:       "invalid",
			mockError:      nil,
			expectedStatus: http.StatusBadRequest,
		},
		{
			name:           "service error",
			followerID:     123,
			targetID:       "456",
			mockError:      errors.New("database error"),
			expectedStatus: http.StatusInternalServerError,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Arrange
			mockRepo := new(MockFollowRepository)
			handler := NewFollowHandler(mockRepo)

			if tt.targetID == "456" {
				mockRepo.On("Unfollow", tt.followerID, int64(456)).Return(tt.mockError)
			}

			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			c.Set("user_id", tt.followerID)
			c.Params = gin.Params{{Key: "id", Value: tt.targetID}}
			c.Request = httptest.NewRequest(http.MethodPost, "/api/v1/users/"+tt.targetID+"/unfollow", nil)

			// Act
			handler.Unfollow(c)

			// Assert
			assert.Equal(t, tt.expectedStatus, w.Code)

			mockRepo.AssertExpectations(t)
		})
	}
}

func TestFollowHandler_IsFollowing(t *testing.T) {
	gin.SetMode(gin.TestMode)

	tests := []struct {
		name            string
		followerID      int64
		targetID        string
		mockIsFollowing bool
		mockError       error
		expectedStatus  int
	}{
		{
			name:            "is following true",
			followerID:      123,
			targetID:        "456",
			mockIsFollowing: true,
			mockError:       nil,
			expectedStatus:  http.StatusOK,
		},
		{
			name:            "is following false",
			followerID:      123,
			targetID:        "456",
			mockIsFollowing: false,
			mockError:       nil,
			expectedStatus:  http.StatusOK,
		},
		{
			name:            "invalid user ID",
			followerID:      123,
			targetID:        "invalid",
			mockIsFollowing: false,
			mockError:       nil,
			expectedStatus:  http.StatusBadRequest,
		},
		{
			name:            "service error",
			followerID:      123,
			targetID:        "456",
			mockIsFollowing: false,
			mockError:       errors.New("database error"),
			expectedStatus:  http.StatusInternalServerError,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Arrange
			mockRepo := new(MockFollowRepository)
			handler := NewFollowHandler(mockRepo)

			if tt.targetID == "456" {
				mockRepo.On("IsFollowing", tt.followerID, int64(456)).Return(tt.mockIsFollowing, tt.mockError)
			}

			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			c.Set("user_id", tt.followerID)
			c.Params = gin.Params{{Key: "id", Value: tt.targetID}}
			c.Request = httptest.NewRequest(http.MethodGet, "/api/v1/users/"+tt.targetID+"/is-following", nil)

			// Act
			handler.IsFollowing(c)

			// Assert
			assert.Equal(t, tt.expectedStatus, w.Code)

			if tt.expectedStatus == http.StatusOK {
				var response map[string]interface{}
				err := json.Unmarshal(w.Body.Bytes(), &response)
				assert.NoError(t, err)
				assert.True(t, response["success"].(bool))

				data := response["data"].(map[string]interface{})
				assert.Equal(t, tt.mockIsFollowing, data["isFollowing"])
			}

			mockRepo.AssertExpectations(t)
		})
	}
}

func TestFollowHandler_GetFollowers(t *testing.T) {
	gin.SetMode(gin.TestMode)

	tests := []struct {
		name           string
		userID         string
		queryParams    string
		mockFollowers  []*user.User
		mockTotal      int64
		mockError      error
		expectedStatus int
	}{
		{
			name:        "successful get followers",
			userID:      "1",
			queryParams: "",
			mockFollowers: []*user.User{
				{ID: 2, Username: "follower1"},
				{ID: 3, Username: "follower2"},
			},
			mockTotal:      2,
			mockError:      nil,
			expectedStatus: http.StatusOK,
		},
		{
			name:           "invalid user ID",
			userID:         "invalid",
			queryParams:    "",
			mockFollowers:  nil,
			mockTotal:      0,
			mockError:      nil,
			expectedStatus: http.StatusBadRequest,
		},
		{
			name:           "with pagination",
			userID:         "1",
			queryParams:    "?limit=10&offset=5",
			mockFollowers:  []*user.User{},
			mockTotal:      20,
			mockError:      nil,
			expectedStatus: http.StatusOK,
		},
		{
			name:           "service error",
			userID:         "1",
			queryParams:    "",
			mockFollowers:  nil,
			mockTotal:      0,
			mockError:      errors.New("database error"),
			expectedStatus: http.StatusInternalServerError,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Arrange
			mockRepo := new(MockFollowRepository)
			handler := NewFollowHandler(mockRepo)

			if tt.userID != "invalid" {
				mockRepo.On("GetFollowers", int64(1), mock.AnythingOfType("int"), mock.AnythingOfType("int")).
					Return(tt.mockFollowers, tt.mockTotal, tt.mockError)
			}

			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			c.Params = gin.Params{{Key: "id", Value: tt.userID}}
			c.Request = httptest.NewRequest(http.MethodGet, "/api/v1/users/"+tt.userID+"/followers"+tt.queryParams, nil)

			// Act
			handler.GetFollowers(c)

			// Assert
			assert.Equal(t, tt.expectedStatus, w.Code)

			if tt.expectedStatus == http.StatusOK {
				var response map[string]interface{}
				err := json.Unmarshal(w.Body.Bytes(), &response)
				assert.NoError(t, err)
				assert.True(t, response["success"].(bool))
			}

			mockRepo.AssertExpectations(t)
		})
	}
}

func TestFollowHandler_GetFollowing(t *testing.T) {
	gin.SetMode(gin.TestMode)

	tests := []struct {
		name           string
		userID         string
		queryParams    string
		mockFollowing  []*user.User
		mockTotal      int64
		mockError      error
		expectedStatus int
	}{
		{
			name:        "successful get following",
			userID:      "1",
			queryParams: "",
			mockFollowing: []*user.User{
				{ID: 2, Username: "following1"},
			},
			mockTotal:      1,
			mockError:      nil,
			expectedStatus: http.StatusOK,
		},
		{
			name:           "invalid user ID",
			userID:         "invalid",
			queryParams:    "",
			mockFollowing:  nil,
			mockTotal:      0,
			mockError:      nil,
			expectedStatus: http.StatusBadRequest,
		},
		{
			name:           "service error",
			userID:         "1",
			queryParams:    "",
			mockFollowing:  nil,
			mockTotal:      0,
			mockError:      errors.New("database error"),
			expectedStatus: http.StatusInternalServerError,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Arrange
			mockRepo := new(MockFollowRepository)
			handler := NewFollowHandler(mockRepo)

			if tt.userID != "invalid" {
				mockRepo.On("GetFollowing", int64(1), mock.AnythingOfType("int"), mock.AnythingOfType("int")).
					Return(tt.mockFollowing, tt.mockTotal, tt.mockError)
			}

			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			c.Params = gin.Params{{Key: "id", Value: tt.userID}}
			c.Request = httptest.NewRequest(http.MethodGet, "/api/v1/users/"+tt.userID+"/following"+tt.queryParams, nil)

			// Act
			handler.GetFollowing(c)

			// Assert
			assert.Equal(t, tt.expectedStatus, w.Code)

			if tt.expectedStatus == http.StatusOK {
				var response map[string]interface{}
				err := json.Unmarshal(w.Body.Bytes(), &response)
				assert.NoError(t, err)
				assert.True(t, response["success"].(bool))
			}

			mockRepo.AssertExpectations(t)
		})
	}
}
