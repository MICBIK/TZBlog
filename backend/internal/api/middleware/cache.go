package middleware

import (
	"crypto/sha256"
	"encoding/hex"
	"time"

	"github.com/MICBIK/TZBlog/backend/internal/cache"
	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
)

// CacheMiddleware creates a cache middleware
func CacheMiddleware(redisClient *redis.Client, duration time.Duration) gin.HandlerFunc {
	cacheStrategy := cache.NewStrategy(redisClient)

	return func(c *gin.Context) {
		// Only cache GET requests
		if c.Request.Method != "GET" {
			c.Next()
			return
		}

		// Skip caching for authenticated requests
		if c.GetHeader("Authorization") != "" {
			c.Next()
			return
		}

		// Generate cache key from URL and query params
		cacheKey := generateCacheKey(c.Request.URL.String())

		// Try to get from cache
		var cachedResponse CachedResponse
		err := cacheStrategy.Get(cacheKey, &cachedResponse)
		if err == nil {
			// Cache hit
			c.Header("X-Cache", "HIT")
			for key, value := range cachedResponse.Headers {
				c.Header(key, value)
			}
			c.Data(cachedResponse.Status, cachedResponse.ContentType, cachedResponse.Body)
			c.Abort()
			return
		}

		// Cache miss - continue to handler
		c.Header("X-Cache", "MISS")

		// Create response writer wrapper
		writer := &responseWriter{
			ResponseWriter: c.Writer,
			body:           []byte{},
		}
		c.Writer = writer

		c.Next()

		// Cache the response
		if c.Writer.Status() == 200 {
			cached := CachedResponse{
				Status:      c.Writer.Status(),
				Body:        writer.body,
				ContentType: c.Writer.Header().Get("Content-Type"),
				Headers:     make(map[string]string),
			}

			// Copy important headers
			for _, header := range []string{"Content-Type", "Content-Language"} {
				if value := c.Writer.Header().Get(header); value != "" {
					cached.Headers[header] = value
				}
			}

			_ = cacheStrategy.Set(cacheKey, cached, duration)
		}
	}
}

type responseWriter struct {
	gin.ResponseWriter
	body []byte
}

func (w *responseWriter) Write(b []byte) (int, error) {
	w.body = append(w.body, b...)
	return w.ResponseWriter.Write(b)
}

type CachedResponse struct {
	Status      int               `json:"status"`
	Body        []byte            `json:"body"`
	ContentType string            `json:"contentType"`
	Headers     map[string]string `json:"headers"`
}

func generateCacheKey(url string) string {
	hash := sha256.Sum256([]byte(url))
	return "cache:" + hex.EncodeToString(hash[:])
}
