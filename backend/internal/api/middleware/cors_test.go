package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func TestCORS(t *testing.T) {
	gin.SetMode(gin.TestMode)

	tests := []struct {
		name            string
		allowedOrigins  []string
		requestOrigin   string
		requestMethod   string
		expectedStatus  int
		expectedHeaders map[string]string
	}{
		{
			name:           "whitelisted origin - GET request",
			allowedOrigins: []string{"https://example.com", "https://app.example.com"},
			requestOrigin:  "https://example.com",
			requestMethod:  "GET",
			expectedStatus: http.StatusOK,
			expectedHeaders: map[string]string{
				"Access-Control-Allow-Origin":      "https://example.com",
				"Access-Control-Allow-Credentials": "true",
			},
		},
		{
			name:           "whitelisted origin - OPTIONS preflight",
			allowedOrigins: []string{"https://example.com"},
			requestOrigin:  "https://example.com",
			requestMethod:  "OPTIONS",
			expectedStatus: http.StatusNoContent,
			expectedHeaders: map[string]string{
				"Access-Control-Allow-Origin":  "https://example.com",
				"Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
				"Access-Control-Max-Age":       "3600",
			},
		},
		{
			name:           "non-whitelisted origin - GET request",
			allowedOrigins: []string{"https://example.com"},
			requestOrigin:  "https://evil.com",
			requestMethod:  "GET",
			expectedStatus: http.StatusOK,
			expectedHeaders: map[string]string{
				"Access-Control-Allow-Origin": "", // Should not be set
			},
		},
		{
			name:           "non-whitelisted origin - OPTIONS preflight",
			allowedOrigins: []string{"https://example.com"},
			requestOrigin:  "https://evil.com",
			requestMethod:  "OPTIONS",
			expectedStatus: http.StatusForbidden,
			expectedHeaders: map[string]string{
				"Access-Control-Allow-Origin": "", // Should not be set
			},
		},
		{
			name:           "no origin header",
			allowedOrigins: []string{"https://example.com"},
			requestOrigin:  "",
			requestMethod:  "GET",
			expectedStatus: http.StatusOK,
			expectedHeaders: map[string]string{
				"Access-Control-Allow-Origin": "", // Should not be set
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			router := gin.New()
			router.Use(CORS(tt.allowedOrigins))
			router.GET("/test", func(c *gin.Context) {
				c.String(http.StatusOK, "OK")
			})
			router.POST("/test", func(c *gin.Context) {
				c.String(http.StatusOK, "OK")
			})

			req := httptest.NewRequest(tt.requestMethod, "/test", nil)
			if tt.requestOrigin != "" {
				req.Header.Set("Origin", tt.requestOrigin)
			}
			w := httptest.NewRecorder()

			router.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedStatus, w.Code)

			for header, expectedValue := range tt.expectedHeaders {
				actualValue := w.Header().Get(header)
				if expectedValue == "" {
					assert.Empty(t, actualValue, "Header %s should be empty", header)
				} else {
					assert.Equal(t, expectedValue, actualValue, "Header %s mismatch", header)
				}
			}
		})
	}
}

func TestDevelopmentCORS(t *testing.T) {
	gin.SetMode(gin.TestMode)

	tests := []struct {
		name           string
		requestMethod  string
		expectedStatus int
	}{
		{
			name:           "GET request with wildcard",
			requestMethod:  "GET",
			expectedStatus: http.StatusOK,
		},
		{
			name:           "OPTIONS preflight with wildcard",
			requestMethod:  "OPTIONS",
			expectedStatus: http.StatusNoContent,
		},
		{
			name:           "POST request with wildcard",
			requestMethod:  "POST",
			expectedStatus: http.StatusOK,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			router := gin.New()
			router.Use(DevelopmentCORS())
			router.GET("/test", func(c *gin.Context) {
				c.String(http.StatusOK, "OK")
			})
			router.POST("/test", func(c *gin.Context) {
				c.String(http.StatusOK, "OK")
			})

			req := httptest.NewRequest(tt.requestMethod, "/test", nil)
			req.Header.Set("Origin", "https://any-origin.com")
			w := httptest.NewRecorder()

			router.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedStatus, w.Code)
			assert.Equal(t, "*", w.Header().Get("Access-Control-Allow-Origin"))
			assert.Equal(t, "true", w.Header().Get("Access-Control-Allow-Credentials"))
		})
	}
}
