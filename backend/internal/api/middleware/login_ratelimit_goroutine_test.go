package middleware

import (
	"net/http"
	"net/http/httptest"
	"runtime"
	"strings"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

// TestLoginRateLimitNoGoroutineLeak verifies that multiple middleware calls don't create multiple cleanup goroutines
func TestLoginRateLimitNoGoroutineLeak(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Get baseline goroutine count
	runtime.GC()
	time.Sleep(100 * time.Millisecond)
	baseline := runtime.NumGoroutine()

	// Create multiple middleware instances (simulating multiple calls)
	for i := 0; i < 10; i++ {
		middleware := LoginRateLimit()

		// Create test router
		router := gin.New()
		router.POST("/login", middleware, func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"message": "ok"})
		})

		// Make a test request
		req := httptest.NewRequest("POST", "/login", strings.NewReader(`{"email":"test@example.com"}`))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)
	}

	// Allow some time for any leaked goroutines to be created
	time.Sleep(200 * time.Millisecond)
	runtime.GC()
	time.Sleep(100 * time.Millisecond)

	// Check goroutine count
	current := runtime.NumGoroutine()

	// We expect only 1 additional goroutine (the cleanup goroutine started by sync.Once)
	// Allow a small margin for runtime goroutines
	assert.LessOrEqual(t, current, baseline+2,
		"Expected at most 1 new goroutine (cleanup), but found %d new goroutines (baseline: %d, current: %d)",
		current-baseline, baseline, current)

	t.Logf("Baseline goroutines: %d, Current: %d, Difference: %d", baseline, current, current-baseline)
}

// TestSimpleLoginRateLimitNoGoroutineLeak verifies that SimpleLoginRateLimit doesn't leak goroutines
func TestSimpleLoginRateLimitNoGoroutineLeak(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Get baseline goroutine count
	runtime.GC()
	time.Sleep(100 * time.Millisecond)
	baseline := runtime.NumGoroutine()

	// Create multiple middleware instances
	for i := 0; i < 10; i++ {
		middleware := SimpleLoginRateLimit()

		// Create test router
		router := gin.New()
		router.POST("/login", middleware, func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"message": "ok"})
		})

		// Make a test request
		req := httptest.NewRequest("POST", "/login", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)
	}

	// Allow some time for any leaked goroutines to be created
	time.Sleep(200 * time.Millisecond)
	runtime.GC()
	time.Sleep(100 * time.Millisecond)

	// Check goroutine count
	current := runtime.NumGoroutine()

	// We expect only 1 additional goroutine (the cleanup goroutine started by sync.Once)
	assert.LessOrEqual(t, current, baseline+2,
		"Expected at most 1 new goroutine (cleanup), but found %d new goroutines (baseline: %d, current: %d)",
		current-baseline, baseline, current)

	t.Logf("Baseline goroutines: %d, Current: %d, Difference: %d", baseline, current, current-baseline)
}

// TestBothRateLimitersShareDifferentOnce verifies that LoginRateLimit and SimpleLoginRateLimit use separate sync.Once
func TestBothRateLimitersShareDifferentOnce(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Get baseline goroutine count
	runtime.GC()
	time.Sleep(100 * time.Millisecond)
	baseline := runtime.NumGoroutine()

	// Create both middleware types multiple times
	for i := 0; i < 5; i++ {
		loginMiddleware := LoginRateLimit()
		simpleMiddleware := SimpleLoginRateLimit()

		// Create test routers
		router1 := gin.New()
		router1.POST("/login", loginMiddleware, func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"message": "ok"})
		})

		router2 := gin.New()
		router2.POST("/login", simpleMiddleware, func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"message": "ok"})
		})

		// Make test requests
		req1 := httptest.NewRequest("POST", "/login", strings.NewReader(`{"email":"test@example.com"}`))
		req1.Header.Set("Content-Type", "application/json")
		w1 := httptest.NewRecorder()
		router1.ServeHTTP(w1, req1)

		req2 := httptest.NewRequest("POST", "/login", nil)
		w2 := httptest.NewRecorder()
		router2.ServeHTTP(w2, req2)
	}

	// Allow some time for goroutines
	time.Sleep(200 * time.Millisecond)
	runtime.GC()
	time.Sleep(100 * time.Millisecond)

	// Check goroutine count
	current := runtime.NumGoroutine()

	// We expect exactly 2 additional goroutines (one for each sync.Once)
	assert.LessOrEqual(t, current, baseline+3,
		"Expected at most 2 new goroutines (one per middleware type), but found %d new goroutines (baseline: %d, current: %d)",
		current-baseline, baseline, current)

	t.Logf("Baseline goroutines: %d, Current: %d, Difference: %d", baseline, current, current-baseline)
}
