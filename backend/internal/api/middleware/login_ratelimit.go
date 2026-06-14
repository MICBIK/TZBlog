package middleware

import (
	"bytes"
	"io"
	"sync"
	"time"

	"github.com/MICBIK/TZBlog/backend/internal/api/response"
	"github.com/gin-gonic/gin"
	"golang.org/x/time/rate"
)

var (
	loginLimiterOnce       sync.Once
	simpleLoginLimiterOnce sync.Once
)

// LoginRateLimit implements rate limiting for login attempts
// Limits to 5 attempts per minute per email+IP combination
func LoginRateLimit() gin.HandlerFunc {
	type limiterKey struct {
		email string
		ip    string
	}

	limiters := make(map[limiterKey]*rate.Limiter)
	var mu sync.RWMutex

	// ✅ Use sync.Once to ensure cleanup goroutine is started only once
	loginLimiterOnce.Do(func() {
		go func() {
			ticker := time.NewTicker(10 * time.Minute)
			defer ticker.Stop()
			for range ticker.C {
				mu.Lock()
				// Reset all limiters periodically to prevent memory leak
				limiters = make(map[limiterKey]*rate.Limiter)
				mu.Unlock()
			}
		}()
	})

	return func(c *gin.Context) {
		// Read the request body
		bodyBytes, err := io.ReadAll(c.Request.Body)
		if err != nil {
			c.Next()
			return
		}

		// Restore the body for later use
		c.Request.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))

		// Extract email from request
		var loginReq struct {
			Email string `json:"email"`
		}

		// Bind to get email
		if err := c.ShouldBindJSON(&loginReq); err != nil {
			// Restore body again after binding attempt
			c.Request.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))
			c.Next()
			return
		}

		// Restore the body for the actual handler
		c.Request.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))

		email := loginReq.Email
		ip := c.ClientIP()
		key := limiterKey{email: email, ip: ip}

		mu.Lock()
		limiter, exists := limiters[key]
		if !exists {
			// 5 requests per minute
			limiter = rate.NewLimiter(rate.Every(time.Minute/5), 5)
			limiters[key] = limiter
		}
		mu.Unlock()

		if !limiter.Allow() {
			response.TooManyRequests(c, "Too many login attempts, please try again later")
			c.Abort()
			return
		}

		c.Next()
	}
}

// SimpleLoginRateLimit is a simpler version using only IP
func SimpleLoginRateLimit() gin.HandlerFunc {
	limiters := make(map[string]*rate.Limiter)
	var mu sync.RWMutex

	// ✅ Use sync.Once to ensure cleanup goroutine is started only once
	simpleLoginLimiterOnce.Do(func() {
		go func() {
			ticker := time.NewTicker(10 * time.Minute)
			defer ticker.Stop()
			for range ticker.C {
				mu.Lock()
				limiters = make(map[string]*rate.Limiter)
				mu.Unlock()
			}
		}()
	})

	return func(c *gin.Context) {
		ip := c.ClientIP()

		mu.Lock()
		limiter, exists := limiters[ip]
		if !exists {
			// 5 requests per minute per IP
			limiter = rate.NewLimiter(rate.Every(time.Minute/5), 5)
			limiters[ip] = limiter
		}
		mu.Unlock()

		if !limiter.Allow() {
			response.TooManyRequests(c, "Too many login attempts, please try again later")
			c.Abort()
			return
		}

		c.Next()
	}
}
