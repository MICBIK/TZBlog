package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/MICBIK/TZBlog/backend/internal/domain/user"
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

func TestAuthHandler_Register_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockRepo := new(MockUserRepository)
	handler := NewAuthHandler(mockRepo, "test-secret", "168h")

	// Mock repository calls
	mockRepo.On("FindByEmail", "test@example.com").Return(nil, nil)
	mockRepo.On("FindByUsername", "testuser").Return(nil, nil)
	mockRepo.On("Create", mock.AnythingOfType("*user.User")).Return(nil)

	// Create request
	reqBody := RegisterRequest{
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
	handler := NewAuthHandler(mockRepo, "test-secret", "168h")

	existingUser := &user.User{
		ID:    1,
		Email: "test@example.com",
	}

	mockRepo.On("FindByEmail", "test@example.com").Return(existingUser, nil)

	reqBody := RegisterRequest{
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
	handler := NewAuthHandler(mockRepo, "test-secret", "168h")

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
	handler := NewAuthHandler(mockRepo, "test-secret", "168h")

	// Use bcrypt to hash the password
	hashedPassword := "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy" // "password"

	existingUser := &user.User{
		ID:           1,
		Email:        "test@example.com",
		PasswordHash: hashedPassword,
		Role:         "user",
	}

	mockRepo.On("FindByEmail", "test@example.com").Return(existingUser, nil)

	reqBody := LoginRequest{
		Email:    "test@example.com",
		Password: "password",
	}
	body, _ := json.Marshal(reqBody)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("POST", "/auth/login", bytes.NewBuffer(body))
	c.Request.Header.Set("Content-Type", "application/json")

	handler.Login(c)

	assert.Equal(t, http.StatusOK, w.Code)
	mockRepo.AssertExpectations(t)
}

func TestAuthHandler_Login_InvalidPassword(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockRepo := new(MockUserRepository)
	handler := NewAuthHandler(mockRepo, "test-secret", "168h")

	hashedPassword := "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy" // "password"

	existingUser := &user.User{
		ID:           1,
		Email:        "test@example.com",
		PasswordHash: hashedPassword,
		Role:         "user",
	}

	mockRepo.On("FindByEmail", "test@example.com").Return(existingUser, nil)

	reqBody := LoginRequest{
		Email:    "test@example.com",
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
	handler := NewAuthHandler(mockRepo, "test-secret", "168h")

	mockRepo.On("FindByEmail", "notfound@example.com").Return(nil, nil)

	reqBody := LoginRequest{
		Email:    "notfound@example.com",
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
	handler := NewAuthHandler(mockRepo, "test-secret", "168h")

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
	handler := NewAuthHandler(mockRepo, "test-secret", "168h")

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("GET", "/auth/me", nil)

	handler.GetCurrentUser(c)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
}
