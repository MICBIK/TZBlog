package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/MICBIK/TZBlog/backend/internal/domain/user"
	"github.com/MICBIK/TZBlog/backend/internal/service"
	"github.com/MICBIK/TZBlog/backend/pkg/auth"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockUserRepository is a mock implementation of user.UserRepository
type MockUserRepository struct {
	mock.Mock
}

func (m *MockUserRepository) Create(u *user.User) error {
	args := m.Called(u)
	return args.Error(0)
}

func (m *MockUserRepository) FindByID(id int64) (*user.User, error) {
	args := m.Called(id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*user.User), args.Error(1)
}

func (m *MockUserRepository) FindByEmail(email string) (*user.User, error) {
	args := m.Called(email)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*user.User), args.Error(1)
}

func (m *MockUserRepository) FindByUsername(username string) (*user.User, error) {
	args := m.Called(username)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*user.User), args.Error(1)
}

func (m *MockUserRepository) Update(u *user.User) error {
	args := m.Called(u)
	return args.Error(0)
}

func (m *MockUserRepository) Delete(id int64) error {
	args := m.Called(id)
	return args.Error(0)
}

func (m *MockUserRepository) UpdateLastLogin(id int64) error {
	args := m.Called(id)
	return args.Error(0)
}

func (m *MockUserRepository) List(limit, offset int) ([]*user.User, int64, error) {
	args := m.Called(limit, offset)
	if args.Get(0) == nil {
		return nil, args.Get(1).(int64), args.Error(2)
	}
	return args.Get(0).([]*user.User), args.Get(1).(int64), args.Error(2)
}

func TestAuthHandler_Register_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockRepo := new(MockUserRepository)
	jwtAuth := auth.NewJWTAuth("test-secret", 168*time.Hour)
	handler := NewAuthHandler(mockRepo, jwtAuth)

	// Mock repository calls
	mockRepo.On("FindByUsername", "testuser").Return(nil, nil)
	mockRepo.On("FindByEmail", "test@example.com").Return(nil, nil)
	mockRepo.On("Create", mock.AnythingOfType("*user.User")).Return(nil)

	// Create request
	reqBody := service.RegisterDTO{
		Username: "testuser",
		Email:    "test@example.com",
		Password: "password123",
	}
	body, _ := json.Marshal(reqBody)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("POST", "/auth/register", bytes.NewBuffer(body))
	c.Request.Header.Set("Content-Type", "application/json")

	handler.Register(c)

	assert.Equal(t, http.StatusCreated, w.Code)
	mockRepo.AssertExpectations(t)
}

func TestAuthHandler_Register_EmailExists(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockRepo := new(MockUserRepository)
	jwtAuth := auth.NewJWTAuth("test-secret", 168*time.Hour)
	handler := NewAuthHandler(mockRepo, jwtAuth)

	existingUser := &user.User{
		ID:    1,
		Email: "test@example.com",
	}

	mockRepo.On("FindByUsername", "testuser").Return(nil, nil)
	mockRepo.On("FindByEmail", "test@example.com").Return(existingUser, nil)

	reqBody := service.RegisterDTO{
		Username: "testuser",
		Email:    "test@example.com",
		Password: "password123",
	}
	body, _ := json.Marshal(reqBody)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("POST", "/auth/register", bytes.NewBuffer(body))
	c.Request.Header.Set("Content-Type", "application/json")

	handler.Register(c)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	mockRepo.AssertExpectations(t)
}

func TestAuthHandler_Register_InvalidInput(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockRepo := new(MockUserRepository)
	jwtAuth := auth.NewJWTAuth("test-secret", 168*time.Hour)
	handler := NewAuthHandler(mockRepo, jwtAuth)

	reqBody := map[string]string{
		"email": "invalid-email", // Invalid email
	}
	body, _ := json.Marshal(reqBody)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("POST", "/auth/register", bytes.NewBuffer(body))
	c.Request.Header.Set("Content-Type", "application/json")

	handler.Register(c)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAuthHandler_Login_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockRepo := new(MockUserRepository)
	jwtAuth := auth.NewJWTAuth("test-secret", 168*time.Hour)
	handler := NewAuthHandler(mockRepo, jwtAuth)

	// Use bcrypt to hash the password
	hashedPassword := "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy" // "password"

	existingUser := &user.User{
		ID:           1,
		Email:        "test@example.com",
		Username:     "testuser",
		PasswordHash: hashedPassword,
		Role:         "user",
		Status:       user.StatusActive,
	}

	mockRepo.On("FindByEmail", "test@example.com").Return(existingUser, nil)
	mockRepo.On("UpdateLastLogin", int64(1)).Return(nil)

	reqBody := service.LoginDTO{
		Login:    "test@example.com",
		Password: "password",
	}
	body, _ := json.Marshal(reqBody)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("POST", "/auth/login", bytes.NewBuffer(body))
	c.Request.Header.Set("Content-Type", "application/json")

	handler.Login(c)

	assert.Equal(t, http.StatusOK, w.Code)

	// Verify response contains token and user
	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Contains(t, response, "data")

	// Give async UpdateLastLogin time to complete
	time.Sleep(10 * time.Millisecond)
	mockRepo.AssertExpectations(t)
}

func TestAuthHandler_Login_InvalidPassword(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockRepo := new(MockUserRepository)
	jwtAuth := auth.NewJWTAuth("test-secret", 168*time.Hour)
	handler := NewAuthHandler(mockRepo, jwtAuth)

	hashedPassword := "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy" // "password"

	existingUser := &user.User{
		ID:           1,
		Email:        "test@example.com",
		PasswordHash: hashedPassword,
		Role:         "user",
		Status:       user.StatusActive,
	}

	mockRepo.On("FindByEmail", "test@example.com").Return(existingUser, nil)

	reqBody := service.LoginDTO{
		Login:    "test@example.com",
		Password: "wrong-password",
	}
	body, _ := json.Marshal(reqBody)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("POST", "/auth/login", bytes.NewBuffer(body))
	c.Request.Header.Set("Content-Type", "application/json")

	handler.Login(c)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
	mockRepo.AssertExpectations(t)
}

func TestAuthHandler_Login_UserNotFound(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockRepo := new(MockUserRepository)
	jwtAuth := auth.NewJWTAuth("test-secret", 168*time.Hour)
	handler := NewAuthHandler(mockRepo, jwtAuth)

	mockRepo.On("FindByEmail", "notfound@example.com").Return(nil, nil)

	reqBody := service.LoginDTO{
		Login:    "notfound@example.com",
		Password: "password",
	}
	body, _ := json.Marshal(reqBody)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("POST", "/auth/login", bytes.NewBuffer(body))
	c.Request.Header.Set("Content-Type", "application/json")

	handler.Login(c)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
	mockRepo.AssertExpectations(t)
}

func TestAuthHandler_GetCurrentUser_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockRepo := new(MockUserRepository)
	jwtAuth := auth.NewJWTAuth("test-secret", 168*time.Hour)
	handler := NewAuthHandler(mockRepo, jwtAuth)

	existingUser := &user.User{
		ID:       123,
		Username: "testuser",
		Email:    "test@example.com",
	}

	mockRepo.On("FindByID", int64(123)).Return(existingUser, nil)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Set("user_id", int64(123))
	c.Request, _ = http.NewRequest("GET", "/auth/me", nil)

	handler.GetCurrentUser(c)

	assert.Equal(t, http.StatusOK, w.Code)
	mockRepo.AssertExpectations(t)
}

func TestAuthHandler_GetCurrentUser_NoUserID(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockRepo := new(MockUserRepository)
	jwtAuth := auth.NewJWTAuth("test-secret", 168*time.Hour)
	handler := NewAuthHandler(mockRepo, jwtAuth)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("GET", "/auth/me", nil)

	handler.GetCurrentUser(c)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestAuthHandler_UpdateProfile_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockRepo := new(MockUserRepository)
	jwtAuth := auth.NewJWTAuth("test-secret", 168*time.Hour)
	handler := NewAuthHandler(mockRepo, jwtAuth)

	existingUser := &user.User{
		ID:          123,
		Username:    "testuser",
		Email:       "test@example.com",
		DisplayName: "Test User",
	}

	newDisplayName := "New Display Name"
	mockRepo.On("FindByID", int64(123)).Return(existingUser, nil)
	mockRepo.On("Update", mock.AnythingOfType("*user.User")).Return(nil)

	reqBody := service.UpdateProfileDTO{
		DisplayName: &newDisplayName,
	}
	body, _ := json.Marshal(reqBody)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Set("user_id", int64(123))
	c.Request, _ = http.NewRequest("PUT", "/auth/profile", bytes.NewBuffer(body))
	c.Request.Header.Set("Content-Type", "application/json")

	handler.UpdateProfile(c)

	assert.Equal(t, http.StatusOK, w.Code)
	mockRepo.AssertExpectations(t)
}

func TestAuthHandler_ChangePassword_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockRepo := new(MockUserRepository)
	jwtAuth := auth.NewJWTAuth("test-secret", 168*time.Hour)
	handler := NewAuthHandler(mockRepo, jwtAuth)

	hashedPassword := "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy" // "password"

	existingUser := &user.User{
		ID:           123,
		Username:     "testuser",
		Email:        "test@example.com",
		PasswordHash: hashedPassword,
	}

	mockRepo.On("FindByID", int64(123)).Return(existingUser, nil)
	mockRepo.On("Update", mock.AnythingOfType("*user.User")).Return(nil)

	reqBody := service.ChangePasswordDTO{
		CurrentPassword: "password",
		NewPassword:     "newpassword123",
	}
	body, _ := json.Marshal(reqBody)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Set("user_id", int64(123))
	c.Request, _ = http.NewRequest("POST", "/auth/change-password", bytes.NewBuffer(body))
	c.Request.Header.Set("Content-Type", "application/json")

	handler.ChangePassword(c)

	assert.Equal(t, http.StatusOK, w.Code)
	mockRepo.AssertExpectations(t)
}

func TestAuthHandler_Logout(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockRepo := new(MockUserRepository)
	jwtAuth := auth.NewJWTAuth("test-secret", 168*time.Hour)
	handler := NewAuthHandler(mockRepo, jwtAuth)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("POST", "/auth/logout", nil)

	handler.Logout(c)

	assert.Equal(t, http.StatusOK, w.Code)
}
