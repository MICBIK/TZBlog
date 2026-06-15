package middleware

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/alicebob/miniredis/v2"
	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func setupRedisForCache(t *testing.T) (*redis.Client, *miniredis.Miniredis) {
	mr, err := miniredis.Run()
	require.NoError(t, err)

	client := redis.NewClient(&redis.Options{
		Addr: mr.Addr(),
	})

	return client, mr
}

func TestCacheMiddleware_CacheMiss(t *testing.T) {
	gin.SetMode(gin.TestMode)
	client, mr := setupRedisForCache(t)
	defer mr.Close()

	router := gin.New()
	router.Use(CacheMiddleware(client, 5*time.Minute))
	router.GET("/test", func(c *gin.Context) {
		c.String(http.StatusOK, "fresh response")
	})

	req := httptest.NewRequest("GET", "/test", nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.Equal(t, "MISS", w.Header().Get("X-Cache"))
	assert.Equal(t, "fresh response", w.Body.String())
}

func TestCacheMiddleware_CacheHit(t *testing.T) {
	gin.SetMode(gin.TestMode)
	client, mr := setupRedisForCache(t)
	defer mr.Close()

	callCount := 0
	router := gin.New()
	router.Use(CacheMiddleware(client, 5*time.Minute))
	router.GET("/test", func(c *gin.Context) {
		callCount++
		c.String(http.StatusOK, "fresh response")
	})

	// First request - cache miss
	req1 := httptest.NewRequest("GET", "/test", nil)
	w1 := httptest.NewRecorder()
	router.ServeHTTP(w1, req1)

	assert.Equal(t, http.StatusOK, w1.Code)
	assert.Equal(t, "MISS", w1.Header().Get("X-Cache"))
	assert.Equal(t, 1, callCount)

	// Second request - cache hit
	req2 := httptest.NewRequest("GET", "/test", nil)
	w2 := httptest.NewRecorder()
	router.ServeHTTP(w2, req2)

	assert.Equal(t, http.StatusOK, w2.Code)
	assert.Equal(t, "HIT", w2.Header().Get("X-Cache"))
	assert.Equal(t, "fresh response", w2.Body.String())
	assert.Equal(t, 1, callCount) // Handler not called again
}

func TestCacheMiddleware_SkipNonGET(t *testing.T) {
	gin.SetMode(gin.TestMode)
	client, mr := setupRedisForCache(t)
	defer mr.Close()

	router := gin.New()
	router.Use(CacheMiddleware(client, 5*time.Minute))
	router.POST("/test", func(c *gin.Context) {
		c.String(http.StatusOK, "POST response")
	})
	router.PUT("/test", func(c *gin.Context) {
		c.String(http.StatusOK, "PUT response")
	})

	// POST request
	reqPost := httptest.NewRequest("POST", "/test", nil)
	wPost := httptest.NewRecorder()
	router.ServeHTTP(wPost, reqPost)

	assert.Equal(t, http.StatusOK, wPost.Code)
	assert.Empty(t, wPost.Header().Get("X-Cache"))

	// PUT request
	reqPut := httptest.NewRequest("PUT", "/test", nil)
	wPut := httptest.NewRecorder()
	router.ServeHTTP(wPut, reqPut)

	assert.Equal(t, http.StatusOK, wPut.Code)
	assert.Empty(t, wPut.Header().Get("X-Cache"))
}

func TestCacheMiddleware_SkipAuthenticated(t *testing.T) {
	gin.SetMode(gin.TestMode)
	client, mr := setupRedisForCache(t)
	defer mr.Close()

	router := gin.New()
	router.Use(CacheMiddleware(client, 5*time.Minute))
	router.GET("/test", func(c *gin.Context) {
		c.String(http.StatusOK, "private response")
	})

	req := httptest.NewRequest("GET", "/test", nil)
	req.Header.Set("Authorization", "Bearer token123")
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.Empty(t, w.Header().Get("X-Cache"))
}

func TestCacheMiddleware_OnlyCache200(t *testing.T) {
	gin.SetMode(gin.TestMode)
	client, mr := setupRedisForCache(t)
	defer mr.Close()

	router := gin.New()
	router.Use(CacheMiddleware(client, 5*time.Minute))
	router.GET("/error", func(c *gin.Context) {
		c.String(http.StatusNotFound, "not found")
	})

	// First request - 404
	req1 := httptest.NewRequest("GET", "/error", nil)
	w1 := httptest.NewRecorder()
	router.ServeHTTP(w1, req1)

	assert.Equal(t, http.StatusNotFound, w1.Code)
	assert.Equal(t, "MISS", w1.Header().Get("X-Cache"))

	// Second request - still MISS (404 not cached)
	req2 := httptest.NewRequest("GET", "/error", nil)
	w2 := httptest.NewRecorder()
	router.ServeHTTP(w2, req2)

	assert.Equal(t, http.StatusNotFound, w2.Code)
	assert.Equal(t, "MISS", w2.Header().Get("X-Cache"))
}

func TestCacheMiddleware_DifferentURLs(t *testing.T) {
	gin.SetMode(gin.TestMode)
	client, mr := setupRedisForCache(t)
	defer mr.Close()

	router := gin.New()
	router.Use(CacheMiddleware(client, 5*time.Minute))
	router.GET("/test", func(c *gin.Context) {
		query := c.Query("q")
		c.String(http.StatusOK, "response for "+query)
	})

	// Request 1 with query param
	req1 := httptest.NewRequest("GET", "/test?q=foo", nil)
	w1 := httptest.NewRecorder()
	router.ServeHTTP(w1, req1)

	assert.Equal(t, http.StatusOK, w1.Code)
	assert.Equal(t, "MISS", w1.Header().Get("X-Cache"))

	// Request 2 with different query param
	req2 := httptest.NewRequest("GET", "/test?q=bar", nil)
	w2 := httptest.NewRecorder()
	router.ServeHTTP(w2, req2)

	assert.Equal(t, http.StatusOK, w2.Code)
	assert.Equal(t, "MISS", w2.Header().Get("X-Cache"))
	assert.Equal(t, "response for bar", w2.Body.String())

	// Request 3 same as request 1 - should hit cache
	req3 := httptest.NewRequest("GET", "/test?q=foo", nil)
	w3 := httptest.NewRecorder()
	router.ServeHTTP(w3, req3)

	assert.Equal(t, http.StatusOK, w3.Code)
	assert.Equal(t, "HIT", w3.Header().Get("X-Cache"))
	assert.Equal(t, "response for foo", w3.Body.String())
}

func TestGenerateCacheKey(t *testing.T) {
	key1 := generateCacheKey("https://example.com/api/articles")
	key2 := generateCacheKey("https://example.com/api/articles")
	key3 := generateCacheKey("https://example.com/api/users")

	// Same URL generates same key
	assert.Equal(t, key1, key2)

	// Different URL generates different key
	assert.NotEqual(t, key1, key3)

	// Key should have prefix
	assert.Contains(t, key1, "cache:")
}

func TestResponseWriter_Write(t *testing.T) {
	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	rw := &responseWriter{
		ResponseWriter: w,
		body:           []byte{},
	}

	n, err := rw.Write([]byte("hello"))
	assert.NoError(t, err)
	assert.Equal(t, 5, n)
	assert.Equal(t, []byte("hello"), rw.body)

	n, err = rw.Write([]byte(" world"))
	assert.NoError(t, err)
	assert.Equal(t, 6, n)
	assert.Equal(t, []byte("hello world"), rw.body)
}
