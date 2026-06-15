package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/MICBIK/TZBlog/backend/internal/domain/user"
	"github.com/gin-gonic/gin"
)

// Mock auth service for benchmarking
type mockAuthServiceBench struct{}

func (m *mockAuthServiceBench) Register(dto *user.RegisterDTO) (*user.AuthResponse, error) {
	return &user.AuthResponse{
		User:  &user.User{ID: 1, Email: dto.Email, Username: dto.Username},
		Token: "mock_token",
	}, nil
}

func (m *mockAuthServiceBench) Login(dto *user.LoginDTO) (*user.AuthResponse, error) {
	return &user.AuthResponse{
		User:  &user.User{ID: 1, Email: dto.Email},
		Token: "mock_token",
	}, nil
}

func (m *mockAuthServiceBench) GetUserByID(id int64) (*user.User, error) {
	return &user.User{ID: id, Email: "test@example.com"}, nil
}

func (m *mockAuthServiceBench) GetCurrentUser(id int64) (*user.User, error) {
	return &user.User{ID: id, Email: "test@example.com"}, nil
}

func (m *mockAuthServiceBench) UpdateProfile(id int64, dto *user.UpdateProfileDTO) (*user.User, error) {
	return &user.User{ID: id}, nil
}

func (m *mockAuthServiceBench) ChangePassword(userID int64, jti string, dto *user.ChangePasswordDTO) error {
	return nil
}

func setupBenchAuthHandler() *AuthHandler {
	gin.SetMode(gin.TestMode)
	return NewAuthHandler(&mockAuthServiceBench{})
}

func createLoginBenchRequest() *http.Request {
	loginReq := user.LoginDTO{
		Email:    "bench@example.com",
		Password: "password123",
	}

	body, _ := json.Marshal(loginReq)
	req, _ := http.NewRequest("POST", "/api/auth/login", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")

	return req
}

func BenchmarkAuthHandler_Login_Concurrent(b *testing.B) {
	handler := setupBenchAuthHandler()

	b.RunParallel(func(pb *testing.PB) {
		for pb.Next() {
			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)

			req := createLoginBenchRequest()
			c.Request = req

			handler.Login(c)
		}
	})
}

func BenchmarkAuthHandler_Register_Concurrent(b *testing.B) {
	handler := setupBenchAuthHandler()

	registerReq := user.RegisterDTO{
		Username: "benchuser",
		Email:    "bench@example.com",
		Password: "password123",
	}

	body, _ := json.Marshal(registerReq)

	b.RunParallel(func(pb *testing.PB) {
		for pb.Next() {
			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)

			req, _ := http.NewRequest("POST", "/api/auth/register", bytes.NewBuffer(body))
			req.Header.Set("Content-Type", "application/json")
			c.Request = req

			handler.Register(c)
		}
	})
}

func BenchmarkAuthHandler_Logout_Concurrent(b *testing.B) {
	handler := setupBenchAuthHandler()

	b.RunParallel(func(pb *testing.PB) {
		for pb.Next() {
			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			c.Set("user_id", int64(123))

			req, _ := http.NewRequest("POST", "/api/auth/logout", nil)
			c.Request = req

			handler.Logout(c)
		}
	})
}
