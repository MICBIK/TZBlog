package middleware_test

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/MICBIK/TZBlog/backend/internal/api/middleware"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func TestIPRateLimiter_NormalRequests(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.Use(middleware.IPRateLimiter(10, 20)) // 10 req/sec, burst 20
	router.GET("/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	// Send a few normal requests
	for i := 0; i < 5; i++ {
		req := httptest.NewRequest("GET", "/test", nil)
		req.RemoteAddr = "192.168.1.1:12345"
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
	}
}

func TestIPRateLimiter_ExceedsLimit(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.Use(middleware.IPRateLimiter(2, 3)) // Very low limit: 2 req/sec, burst 3
	router.GET("/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	successCount := 0
	rateLimitCount := 0

	// Burst through the limit quickly
	for i := 0; i < 10; i++ {
		req := httptest.NewRequest("GET", "/test", nil)
		req.RemoteAddr = "192.168.1.2:12345"
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		if w.Code == http.StatusOK {
			successCount++
		} else if w.Code == http.StatusTooManyRequests {
			rateLimitCount++
		}
	}

	// Should have some successful requests and some rate limited
	assert.Greater(t, successCount, 0, "Should have at least some successful requests")
	assert.Greater(t, rateLimitCount, 0, "Should have at least some rate limited requests")
}

func TestIPRateLimiter_ResetWindow(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.Use(middleware.IPRateLimiter(5, 5)) // 5 req/sec, burst 5
	router.GET("/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	// Exhaust the limit
	for i := 0; i < 6; i++ {
		req := httptest.NewRequest("GET", "/test", nil)
		req.RemoteAddr = "192.168.1.3:12345"
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)
	}

	// Wait for token bucket to refill
	time.Sleep(1 * time.Second)

	// Should be able to make successful requests again
	req := httptest.NewRequest("GET", "/test", nil)
	req.RemoteAddr = "192.168.1.3:12345"
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestIPRateLimiter_DifferentIPs(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.Use(middleware.IPRateLimiter(2, 3)) // Low limit
	router.GET("/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	// Different IPs should have independent rate limits
	ips := []string{"192.168.1.10:12345", "192.168.1.11:12345", "192.168.1.12:12345"}

	for _, ip := range ips {
		req := httptest.NewRequest("GET", "/test", nil)
		req.RemoteAddr = ip
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code, "Each IP should have its own rate limit")
	}
}

func TestIPRateLimiter_InvalidRemoteAddr(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.Use(middleware.IPRateLimiter(10, 20))
	router.GET("/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	// Empty RemoteAddr
	req := httptest.NewRequest("GET", "/test", nil)
	req.RemoteAddr = ""
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Should still work (uses "unknown" as IP)
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestIPRateLimiter_XForwardedFor(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.Use(middleware.IPRateLimiter(10, 20))
	router.GET("/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	// Test with X-Forwarded-For header
	req := httptest.NewRequest("GET", "/test", nil)
	req.RemoteAddr = "192.168.1.1:12345"
	req.Header.Set("X-Forwarded-For", "203.0.113.1")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}
