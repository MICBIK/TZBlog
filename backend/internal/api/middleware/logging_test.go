package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/MICBIK/TZBlog/backend/pkg/logger"
	"github.com/gin-gonic/gin"
)

func init() {
	// Initialize logger for tests
	logger.Init("development")
}

func TestRequestLogger(t *testing.T) {
	gin.SetMode(gin.TestMode)

	tests := []struct {
		name       string
		method     string
		path       string
		statusCode int
		userID     string
	}{
		{
			name:       "successful request",
			method:     "GET",
			path:       "/test",
			statusCode: 200,
			userID:     "",
		},
		{
			name:       "request with user",
			method:     "POST",
			path:       "/api/articles",
			statusCode: 201,
			userID:     "user-123",
		},
		{
			name:       "client error",
			method:     "GET",
			path:       "/not-found",
			statusCode: 404,
			userID:     "",
		},
		{
			name:       "server error",
			method:     "POST",
			path:       "/error",
			statusCode: 500,
			userID:     "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)

			c.Request = httptest.NewRequest(tt.method, tt.path, nil)

			if tt.userID != "" {
				c.Set("user_id", tt.userID)
			}

			// Create handler chain
			handler := RequestLogger()
			handler(c)

			// Simulate response
			c.Writer.WriteHeader(tt.statusCode)
		})
	}
}

func TestRecoveryLogger(t *testing.T) {
	gin.SetMode(gin.TestMode)

	w := httptest.NewRecorder()
	c, r := gin.CreateTestContext(w)

	// Setup recovery middleware
	r.Use(RecoveryLogger())

	// Add route that panics
	r.GET("/panic", func(c *gin.Context) {
		panic("test panic")
	})

	c.Request = httptest.NewRequest("GET", "/panic", nil)
	r.ServeHTTP(w, c.Request)

	if w.Code != http.StatusInternalServerError {
		t.Errorf("Expected status 500, got %d", w.Code)
	}
}

func BenchmarkRequestLogger(b *testing.B) {
	gin.SetMode(gin.TestMode)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest("GET", "/test", nil)

	handler := RequestLogger()

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		handler(c)
		c.Writer.WriteHeader(200)
	}
}
