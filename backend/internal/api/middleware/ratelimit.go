package middleware

import (
	"sync"
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

// ipRateLimiter manages per-IP rate limiters with concurrent safety
type ipRateLimiter struct {
	mu       sync.RWMutex
	limiters map[string]*limiterEntry
	rps      int
	burst    int
}

// limiterEntry stores a rate limiter with its last access time
type limiterEntry struct {
	limiter  *rate.Limiter
	lastSeen time.Time
}

// IPRateLimiter creates per-IP rate limiting with concurrent safety
func IPRateLimiter(rps int, burst int) gin.HandlerFunc {
	rl := &ipRateLimiter{
		limiters: make(map[string]*limiterEntry),
		rps:      rps,
		burst:    burst,
	}

	// Clean up old limiters every hour
	go func() {
		ticker := time.NewTicker(time.Hour)
		defer ticker.Stop()

		for range ticker.C {
			rl.cleanup()
		}
	}()

	return func(c *gin.Context) {
		ip := c.ClientIP()
		limiter := rl.getLimiter(ip)

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

// getLimiter retrieves or creates a rate limiter for the given IP
func (rl *ipRateLimiter) getLimiter(ip string) *rate.Limiter {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	entry, exists := rl.limiters[ip]
	if !exists {
		entry = &limiterEntry{
			limiter:  rate.NewLimiter(rate.Limit(rl.rps), rl.burst),
			lastSeen: time.Now(),
		}
		rl.limiters[ip] = entry
	} else {
		entry.lastSeen = time.Now()
	}

	return entry.limiter
}

// cleanup removes limiters that haven't been accessed in the last hour
func (rl *ipRateLimiter) cleanup() {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := time.Now()
	for ip, entry := range rl.limiters {
		if now.Sub(entry.lastSeen) > time.Hour {
			delete(rl.limiters, ip)
		}
	}
}
