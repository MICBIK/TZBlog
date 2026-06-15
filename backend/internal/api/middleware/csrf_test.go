package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestCSRF(t *testing.T) {
	gin.SetMode(gin.TestMode)

	tests := []struct {
		name           string
		method         string
		cookieToken    string
		headerToken    string
		expectedStatus int
		shouldPass     bool
	}{
		{
			name:           "GET request - should pass",
			method:         "GET",
			cookieToken:    "",
			headerToken:    "",
			expectedStatus: http.StatusOK,
			shouldPass:     true,
		},
		{
			name:           "HEAD request - should pass",
			method:         "HEAD",
			cookieToken:    "",
			headerToken:    "",
			expectedStatus: http.StatusOK,
			shouldPass:     true,
		},
		{
			name:           "OPTIONS request - should pass",
			method:         "OPTIONS",
			cookieToken:    "",
			headerToken:    "",
			expectedStatus: http.StatusOK,
			shouldPass:     true,
		},
		{
			name:           "POST with matching tokens",
			method:         "POST",
			cookieToken:    "valid-token-123",
			headerToken:    "valid-token-123",
			expectedStatus: http.StatusOK,
			shouldPass:     true,
		},
		{
			name:           "POST missing cookie token",
			method:         "POST",
			cookieToken:    "",
			headerToken:    "some-token",
			expectedStatus: http.StatusForbidden,
			shouldPass:     false,
		},
		{
			name:           "POST missing header token",
			method:         "POST",
			cookieToken:    "some-token",
			headerToken:    "",
			expectedStatus: http.StatusForbidden,
			shouldPass:     false,
		},
		{
			name:           "POST with mismatched tokens",
			method:         "POST",
			cookieToken:    "token-1",
			headerToken:    "token-2",
			expectedStatus: http.StatusForbidden,
			shouldPass:     false,
		},
		{
			name:           "PUT with matching tokens",
			method:         "PUT",
			cookieToken:    "valid-token-456",
			headerToken:    "valid-token-456",
			expectedStatus: http.StatusOK,
			shouldPass:     true,
		},
		{
			name:           "DELETE with matching tokens",
			method:         "DELETE",
			cookieToken:    "valid-token-789",
			headerToken:    "valid-token-789",
			expectedStatus: http.StatusOK,
			shouldPass:     true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			router := gin.New()
			router.Use(CSRF())
			router.Any("/test", func(c *gin.Context) {
				c.String(http.StatusOK, "OK")
			})

			req := httptest.NewRequest(tt.method, "/test", nil)
			if tt.cookieToken != "" {
				req.AddCookie(&http.Cookie{Name: "csrf_token", Value: tt.cookieToken})
			}
			if tt.headerToken != "" {
				req.Header.Set("X-CSRF-Token", tt.headerToken)
			}
			w := httptest.NewRecorder()

			router.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedStatus, w.Code)
		})
	}
}

func TestGenerateCSRFToken(t *testing.T) {
	t.Run("generates valid token", func(t *testing.T) {
		token, err := GenerateCSRFToken()
		require.NoError(t, err)
		assert.NotEmpty(t, token)
		assert.Greater(t, len(token), 40) // Base64 encoded 32 bytes should be > 40 chars
	})

	t.Run("generates unique tokens", func(t *testing.T) {
		token1, err1 := GenerateCSRFToken()
		token2, err2 := GenerateCSRFToken()
		require.NoError(t, err1)
		require.NoError(t, err2)
		assert.NotEqual(t, token1, token2)
	})
}

func TestSetCSRFToken(t *testing.T) {
	gin.SetMode(gin.TestMode)

	t.Run("sets cookie and header", func(t *testing.T) {
		router := gin.New()
		router.GET("/csrf", func(c *gin.Context) {
			err := SetCSRFToken(c)
			require.NoError(t, err)
			c.String(http.StatusOK, "OK")
		})

		req := httptest.NewRequest("GET", "/csrf", nil)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		// Check cookie is set
		cookies := w.Result().Cookies()
		require.Len(t, cookies, 1)
		assert.Equal(t, "csrf_token", cookies[0].Name)
		assert.NotEmpty(t, cookies[0].Value)
		assert.True(t, cookies[0].HttpOnly)

		// Check header is set
		headerToken := w.Header().Get("X-CSRF-Token")
		assert.NotEmpty(t, headerToken)
		assert.Equal(t, cookies[0].Value, headerToken)
	})
}

func TestOptionalCSRF(t *testing.T) {
	gin.SetMode(gin.TestMode)

	tests := []struct {
		name           string
		method         string
		authenticated  bool
		cookieToken    string
		headerToken    string
		expectedStatus int
	}{
		{
			name:           "GET - always pass",
			method:         "GET",
			authenticated:  false,
			expectedStatus: http.StatusOK,
		},
		{
			name:           "POST unauthenticated - should pass",
			method:         "POST",
			authenticated:  false,
			cookieToken:    "",
			headerToken:    "",
			expectedStatus: http.StatusOK,
		},
		{
			name:           "POST authenticated with valid tokens",
			method:         "POST",
			authenticated:  true,
			cookieToken:    "valid-token",
			headerToken:    "valid-token",
			expectedStatus: http.StatusOK,
		},
		{
			name:           "POST authenticated missing cookie",
			method:         "POST",
			authenticated:  true,
			cookieToken:    "",
			headerToken:    "some-token",
			expectedStatus: http.StatusForbidden,
		},
		{
			name:           "POST authenticated missing header",
			method:         "POST",
			authenticated:  true,
			cookieToken:    "some-token",
			headerToken:    "",
			expectedStatus: http.StatusForbidden,
		},
		{
			name:           "POST authenticated with mismatched tokens",
			method:         "POST",
			authenticated:  true,
			cookieToken:    "token-1",
			headerToken:    "token-2",
			expectedStatus: http.StatusForbidden,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			router := gin.New()
			router.Use(func(c *gin.Context) {
				if tt.authenticated {
					c.Set("user_id", int64(123))
				}
				c.Next()
			})
			router.Use(OptionalCSRF())
			router.Any("/test", func(c *gin.Context) {
				c.String(http.StatusOK, "OK")
			})

			req := httptest.NewRequest(tt.method, "/test", nil)
			if tt.cookieToken != "" {
				req.AddCookie(&http.Cookie{Name: "csrf_token", Value: tt.cookieToken})
			}
			if tt.headerToken != "" {
				req.Header.Set("X-CSRF-Token", tt.headerToken)
			}
			w := httptest.NewRecorder()

			router.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedStatus, w.Code)
		})
	}
}
