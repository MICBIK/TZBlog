package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func setupBenchAuthHandler() *AuthHandler {
	gin.SetMode(gin.TestMode)
	mockService := &mockAuthService{}
	return NewAuthHandler(mockService)
}

func createLoginBenchRequest() *http.Request {
	loginReq := LoginRequest{
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

	registerReq := RegisterRequest{
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

func BenchmarkAuthHandler_RefreshToken_Concurrent(b *testing.B) {
	handler := setupBenchAuthHandler()

	refreshReq := RefreshTokenRequest{
		RefreshToken: "bench_refresh_token",
	}

	body, _ := json.Marshal(refreshReq)

	b.RunParallel(func(pb *testing.PB) {
		for pb.Next() {
			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)

			req, _ := http.NewRequest("POST", "/api/auth/refresh", bytes.NewBuffer(body))
			req.Header.Set("Content-Type", "application/json")
			c.Request = req

			handler.RefreshToken(c)
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
