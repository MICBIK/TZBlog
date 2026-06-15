package handlers

import (
	"bytes"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/MICBIK/TZBlog/backend/internal/domain/user"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockUserService is a mock implementation of user.Service
type MockUserService struct {
	mock.Mock
}

func (m *MockUserService) Register(dto *user.RegisterDTO) (*user.AuthResponse, error) {
	args := m.Called(dto)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*user.AuthResponse), args.Error(1)
}

func (m *MockUserService) Login(dto *user.LoginDTO) (*user.AuthResponse, error) {
	args := m.Called(dto)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*user.AuthResponse), args.Error(1)
}

func (m *MockUserService) GetUserByID(id int64) (*user.User, error) {
	args := m.Called(id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*user.User), args.Error(1)
}

func (m *MockUserService) GetCurrentUser(userID int64) (*user.User, error) {
	args := m.Called(userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*user.User), args.Error(1)
}

func (m *MockUserService) UpdateProfile(userID int64, dto *user.UpdateProfileDTO) (*user.User, error) {
	args := m.Called(userID, dto)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*user.User), args.Error(1)
}

func (m *MockUserService) ChangePassword(userID int64, jti string, dto *user.ChangePasswordDTO) error {
	args := m.Called(userID, jti, dto)
	return args.Error(0)
}

func TestAuthHandler_Register(t *testing.T) {
	gin.SetMode(gin.TestMode)

	now := time.Now()
	tests := []struct {
		name           string
		requestBody    interface{}
		mockResponse   *user.AuthResponse
		mockError      error
		expectedStatus int
	}{
		{
			name: "successful registration",
			requestBody: user.RegisterDTO{
				Username: "testuser",
				Email:    "test@example.com",
				Password: "password123",
			},
			mockResponse: &user.AuthResponse{
				User: &user.User{
					ID:        1,
					Username:  "testuser",
					Email:     "test@example.com",
					CreatedAt: now,
					UpdatedAt: now,
				},
				Token: "jwt.token.here",
			},
			mockError:      nil,
			expectedStatus: http.StatusCreated,
		},
		{
			name:           "invalid request body",
			requestBody:    `{"invalid": json}`,
			mockResponse:   nil,
			mockError:      nil,
			expectedStatus: http.StatusBadRequest,
		},
		{
			name: "missing required fields",
			requestBody: user.RegisterDTO{
				Username: "testuser",
				// Missing Email and Password
			},
			mockResponse:   nil,
			mockError:      nil,
			expectedStatus: http.StatusBadRequest,
		},
		{
			name: "user already exists",
			requestBody: user.RegisterDTO{
				Username: "testuser",
				Email:    "test@example.com",
				Password: "password123",
			},
			mockResponse:   nil,
			mockError:      user.ErrUserExists,
			expectedStatus: http.StatusConflict,
		},
		{
			name: "weak password",
			requestBody: user.RegisterDTO{
				Username: "testuser",
				Email:    "test@example.com",
				Password: "weak",
			},
			mockResponse:   nil,
			mockError:      nil,
			expectedStatus: http.StatusBadRequest,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Arrange
			mockService := new(MockUserService)
			handler := NewAuthHandler(mockService)

			if tt.expectedStatus == http.StatusCreated || tt.mockError != nil {
				mockService.On("Register", mock.AnythingOfType("*user.RegisterDTO")).
					Return(tt.mockResponse, tt.mockError)
			}

			var body []byte
			if str, ok := tt.requestBody.(string); ok {
				body = []byte(str)
			} else {
				body, _ = json.Marshal(tt.requestBody)
			}

			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			c.Request = httptest.NewRequest(http.MethodPost, "/api/v1/auth/register", bytes.NewReader(body))
			c.Request.Header.Set("Content-Type", "application/json")

			// Act
			handler.Register(c)

			// Assert
			assert.Equal(t, tt.expectedStatus, w.Code)

			if tt.expectedStatus == http.StatusCreated {
				var response map[string]interface{}
				err := json.Unmarshal(w.Body.Bytes(), &response)
				assert.NoError(t, err)
				assert.True(t, response["success"].(bool))
				assert.NotNil(t, response["data"])

				data := response["data"].(map[string]interface{})
				assert.NotNil(t, data["user"])
				assert.NotNil(t, data["token"])
			}

			mockService.AssertExpectations(t)
		})
	}
}

func TestAuthHandler_Login(t *testing.T) {
	gin.SetMode(gin.TestMode)

	now := time.Now()
	tests := []struct {
		name           string
		requestBody    interface{}
		mockResponse   *user.AuthResponse
		mockError      error
		expectedStatus int
	}{
		{
			name: "successful login",
			requestBody: user.LoginDTO{
				Email:    "test@example.com",
				Password: "password123",
			},
			mockResponse: &user.AuthResponse{
				User: &user.User{
					ID:        1,
					Username:  "testuser",
					Email:     "test@example.com",
					CreatedAt: now,
					UpdatedAt: now,
				},
				Token: "jwt.token.here",
			},
			mockError:      nil,
			expectedStatus: http.StatusOK,
		},
		{
			name:           "invalid request body",
			requestBody:    `{"invalid": json}`,
			mockResponse:   nil,
			mockError:      nil,
			expectedStatus: http.StatusBadRequest,
		},
		{
			name: "missing required fields",
			requestBody: user.LoginDTO{
				Email: "test@example.com",
				// Missing Password
			},
			mockResponse:   nil,
			mockError:      nil,
			expectedStatus: http.StatusBadRequest,
		},
		{
			name: "invalid credentials",
			requestBody: user.LoginDTO{
				Email:    "test@example.com",
				Password: "wrongpassword",
			},
			mockResponse:   nil,
			mockError:      user.ErrInvalidCredentials,
			expectedStatus: http.StatusUnauthorized,
		},
		{
			name: "user not found",
			requestBody: user.LoginDTO{
				Email:    "nonexistent@example.com",
				Password: "password123",
			},
			mockResponse:   nil,
			mockError:      user.ErrUserNotFound,
			expectedStatus: http.StatusNotFound,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Arrange
			mockService := new(MockUserService)
			handler := NewAuthHandler(mockService)

			if tt.expectedStatus == http.StatusOK || tt.mockError != nil {
				mockService.On("Login", mock.AnythingOfType("*user.LoginDTO")).
					Return(tt.mockResponse, tt.mockError)
			}

			var body []byte
			if str, ok := tt.requestBody.(string); ok {
				body = []byte(str)
			} else {
				body, _ = json.Marshal(tt.requestBody)
			}

			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			c.Request = httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewReader(body))
			c.Request.Header.Set("Content-Type", "application/json")

			// Act
			handler.Login(c)

			// Assert
			assert.Equal(t, tt.expectedStatus, w.Code)

			if tt.expectedStatus == http.StatusOK {
				var response map[string]interface{}
				err := json.Unmarshal(w.Body.Bytes(), &response)
				assert.NoError(t, err)
				assert.True(t, response["success"].(bool))
				assert.NotNil(t, response["data"])

				data := response["data"].(map[string]interface{})
				assert.NotNil(t, data["user"])
				assert.NotNil(t, data["token"])
			}

			mockService.AssertExpectations(t)
		})
	}
}

func TestAuthHandler_GetCurrentUser(t *testing.T) {
	gin.SetMode(gin.TestMode)

	now := time.Now()
	tests := []struct {
		name           string
		userID         int64
		mockUser       *user.User
		mockError      error
		expectedStatus int
	}{
		{
			name:   "successful get current user",
			userID: 123,
			mockUser: &user.User{
				ID:        123,
				Username:  "testuser",
				Email:     "test@example.com",
				CreatedAt: now,
				UpdatedAt: now,
			},
			mockError:      nil,
			expectedStatus: http.StatusOK,
		},
		{
			name:           "missing user_id",
			userID:         0,
			mockUser:       nil,
			mockError:      nil,
			expectedStatus: http.StatusUnauthorized,
		},
		{
			name:           "user not found",
			userID:         999,
			mockUser:       nil,
			mockError:      user.ErrUserNotFound,
			expectedStatus: http.StatusNotFound,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Arrange
			mockService := new(MockUserService)
			handler := NewAuthHandler(mockService)

			if tt.userID != 0 {
				mockService.On("GetCurrentUser", tt.userID).Return(tt.mockUser, tt.mockError)
			}

			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			c.Set("user_id", tt.userID)
			c.Request = httptest.NewRequest(http.MethodGet, "/api/v1/auth/me", nil)

			// Act
			handler.GetCurrentUser(c)

			// Assert
			assert.Equal(t, tt.expectedStatus, w.Code)

			if tt.expectedStatus == http.StatusOK {
				var response map[string]interface{}
				err := json.Unmarshal(w.Body.Bytes(), &response)
				assert.NoError(t, err)
				assert.True(t, response["success"].(bool))
				assert.NotNil(t, response["data"])
			}

			mockService.AssertExpectations(t)
		})
	}
}

func TestAuthHandler_UpdateProfile(t *testing.T) {
	gin.SetMode(gin.TestMode)

	now := time.Now()
	newBio := "Updated bio"
	newDisplayName := "Updated Name"

	tests := []struct {
		name           string
		userID         int64
		requestBody    interface{}
		mockUser       *user.User
		mockError      error
		expectedStatus int
	}{
		{
			name:   "successful update",
			userID: 123,
			requestBody: user.UpdateProfileDTO{
				DisplayName: &newDisplayName,
				Bio:         &newBio,
			},
			mockUser: &user.User{
				ID:          123,
				Username:    "testuser",
				Email:       "test@example.com",
				DisplayName: newDisplayName,
				Bio:         newBio,
				CreatedAt:   now,
				UpdatedAt:   time.Now(),
			},
			mockError:      nil,
			expectedStatus: http.StatusOK,
		},
		{
			name:           "missing user_id",
			userID:         0,
			requestBody:    user.UpdateProfileDTO{},
			mockUser:       nil,
			mockError:      nil,
			expectedStatus: http.StatusUnauthorized,
		},
		{
			name:           "invalid request body",
			userID:         123,
			requestBody:    `{"invalid": json}`,
			mockUser:       nil,
			mockError:      nil,
			expectedStatus: http.StatusBadRequest,
		},
		{
			name:   "service error",
			userID: 123,
			requestBody: user.UpdateProfileDTO{
				Bio: &newBio,
			},
			mockUser:       nil,
			mockError:      errors.New("database error"),
			expectedStatus: http.StatusInternalServerError,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Arrange
			mockService := new(MockUserService)
			handler := NewAuthHandler(mockService)

			if tt.userID != 0 && tt.expectedStatus != http.StatusBadRequest {
				mockService.On("UpdateProfile", tt.userID, mock.AnythingOfType("*user.UpdateProfileDTO")).
					Return(tt.mockUser, tt.mockError)
			}

			var body []byte
			if str, ok := tt.requestBody.(string); ok {
				body = []byte(str)
			} else {
				body, _ = json.Marshal(tt.requestBody)
			}

			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			c.Set("user_id", tt.userID)
			c.Request = httptest.NewRequest(http.MethodPut, "/api/v1/auth/profile", bytes.NewReader(body))
			c.Request.Header.Set("Content-Type", "application/json")

			// Act
			handler.UpdateProfile(c)

			// Assert
			assert.Equal(t, tt.expectedStatus, w.Code)

			if tt.expectedStatus == http.StatusOK {
				var response map[string]interface{}
				err := json.Unmarshal(w.Body.Bytes(), &response)
				assert.NoError(t, err)
				assert.True(t, response["success"].(bool))
				assert.NotNil(t, response["data"])
			}

			mockService.AssertExpectations(t)
		})
	}
}

func TestAuthHandler_ChangePassword(t *testing.T) {
	gin.SetMode(gin.TestMode)

	tests := []struct {
		name           string
		userID         int64
		requestBody    interface{}
		mockError      error
		expectedStatus int
	}{
		{
			name:   "successful password change",
			userID: 123,
			requestBody: user.ChangePasswordDTO{
				CurrentPassword: "oldpass123",
				NewPassword:     "newpass456",
			},
			mockError:      nil,
			expectedStatus: http.StatusOK,
		},
		{
			name:           "missing user_id",
			userID:         0,
			requestBody:    user.ChangePasswordDTO{},
			mockError:      nil,
			expectedStatus: http.StatusUnauthorized,
		},
		{
			name:           "invalid request body",
			userID:         123,
			requestBody:    `{"invalid": json}`,
			mockError:      nil,
			expectedStatus: http.StatusBadRequest,
		},
		{
			name:   "missing required fields",
			userID: 123,
			requestBody: user.ChangePasswordDTO{
				CurrentPassword: "oldpass123",
				// Missing NewPassword
			},
			mockError:      nil,
			expectedStatus: http.StatusBadRequest,
		},
		{
			name:   "wrong current password",
			userID: 123,
			requestBody: user.ChangePasswordDTO{
				CurrentPassword: "wrongpass",
				NewPassword:     "newpass456",
			},
			mockError:      user.ErrInvalidCredentials,
			expectedStatus: http.StatusUnauthorized,
		},
		{
			name:   "weak new password",
			userID: 123,
			requestBody: user.ChangePasswordDTO{
				CurrentPassword: "oldpass123",
				NewPassword:     "weak",
			},
			mockError:      nil,
			expectedStatus: http.StatusBadRequest,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Arrange
			mockService := new(MockUserService)
			handler := NewAuthHandler(mockService)

			if tt.userID != 0 && tt.expectedStatus != http.StatusBadRequest {
				mockService.On("ChangePassword", tt.userID, mock.AnythingOfType("string"), mock.AnythingOfType("*user.ChangePasswordDTO")).
					Return(tt.mockError)
			}

			var body []byte
			if str, ok := tt.requestBody.(string); ok {
				body = []byte(str)
			} else {
				body, _ = json.Marshal(tt.requestBody)
			}

			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			c.Set("user_id", tt.userID)
			c.Request = httptest.NewRequest(http.MethodPost, "/api/v1/auth/change-password", bytes.NewReader(body))
			c.Request.Header.Set("Content-Type", "application/json")

			// Act
			handler.ChangePassword(c)

			// Assert
			assert.Equal(t, tt.expectedStatus, w.Code)

			if tt.expectedStatus == http.StatusOK {
				var response map[string]interface{}
				err := json.Unmarshal(w.Body.Bytes(), &response)
				assert.NoError(t, err)
				assert.True(t, response["success"].(bool))
			}

			mockService.AssertExpectations(t)
		})
	}
}

func TestAuthHandler_Logout(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Arrange
	mockService := new(MockUserService)
	handler := NewAuthHandler(mockService)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodPost, "/api/v1/auth/logout", nil)

	// Act
	handler.Logout(c)

	// Assert
	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.True(t, response["success"].(bool))

	data := response["data"].(map[string]interface{})
	assert.Equal(t, "Logged out successfully", data["message"])
}
