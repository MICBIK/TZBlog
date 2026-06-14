package middleware

import (
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/time/rate"
)

// RateLimiter creates a rate limiting middleware
func RateLimiter(rps int, burst int) gin.HandlerFunc {
	limiter := rate.NewLimiter(rate.Limit(rps), burst)

	return func(c *gin.Context) {
		if !limiter.Allow() {
			c.JSON(429, gin.H{
				"success": false,
				"error": gin.H{
					"code":    429,
					"message": "Too many requests. Please try again later.",
				},
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// IPRateLimiter creates per-IP rate limiting
func IPRateLimiter(rps int, burst int) gin.HandlerFunc {
	limiters := make(map[string]*rate.Limiter)

	// Clean up old limiters every hour
	go func() {
		ticker := time.NewTicker(time.Hour)
		defer ticker.Stop()

		for range ticker.C {
			limiters = make(map[string]*rate.Limiter)
		}
	}()

	return func(c *gin.Context) {
		ip := c.ClientIP()

		limiter, exists := limiters[ip]
		if !exists {
			limiter = rate.NewLimiter(rate.Limit(rps), burst)
			limiters[ip] = limiter
		}

		if !limiter.Allow() {
			c.JSON(429, gin.H{
				"success": false,
				"error": gin.H{
					"code":    429,
					"message": "Too many requests from your IP. Please try again later.",
				},
			})
			c.Abort()
			return
		}

		c.Next()
	}
}
