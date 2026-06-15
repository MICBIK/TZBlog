package middleware

import (
	"crypto/rand"
	"encoding/base64"

	"github.com/MICBIK/TZBlog/backend/internal/api/response"
	"github.com/gin-gonic/gin"
)

// CSRF implements Double Submit Cookie pattern for CSRF protection
// ✅ SEC-006 FIX: CSRF protection for state-changing operations
func CSRF() gin.HandlerFunc {
	return func(c *gin.Context) {
		method := c.Request.Method

		// Skip CSRF check for safe methods
		if method == "GET" || method == "HEAD" || method == "OPTIONS" {
			c.Next()
			return
		}

		// Get CSRF token from cookie
		cookieToken, err := c.Cookie("csrf_token")
		if err != nil {
			response.Forbidden(c, "CSRF token missing in cookie")
			c.Abort()
			return
		}

		// Get CSRF token from header
		headerToken := c.GetHeader("X-CSRF-Token")
		if headerToken == "" {
			response.Forbidden(c, "CSRF token missing in header")
			c.Abort()
			return
		}

		// Validate tokens match (Double Submit Cookie pattern)
		if headerToken != cookieToken {
			response.Forbidden(c, "CSRF token mismatch")
			c.Abort()
			return
		}

		c.Next()
	}
}

// GenerateCSRFToken generates a new CSRF token
func GenerateCSRFToken() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(b), nil
}

// SetCSRFToken sets CSRF token cookie
func SetCSRFToken(c *gin.Context) error {
	token, err := GenerateCSRFToken()
	if err != nil {
		return err
	}

	// Set cookie with secure flags
	c.SetCookie(
		"csrf_token",         // name
		token,                // value
		3600,                 // max age (1 hour)
		"/",                  // path
		"",                   // domain (empty for current domain)
		c.Request.TLS != nil, // secure (HTTPS only)
		true,                 // httpOnly
	)

	// Also return in response header for client to use
	c.Header("X-CSRF-Token", token)

	return nil
}

// OptionalCSRF applies CSRF protection only when user is authenticated
func OptionalCSRF() gin.HandlerFunc {
	return func(c *gin.Context) {
		method := c.Request.Method

		// Skip for safe methods
		if method == "GET" || method == "HEAD" || method == "OPTIONS" {
			c.Next()
			return
		}

		// Only enforce CSRF if user is authenticated
		_, authenticated := c.Get("user_id")
		if !authenticated {
			c.Next()
			return
		}

		// Check CSRF tokens
		cookieToken, err := c.Cookie("csrf_token")
		if err != nil {
			response.Forbidden(c, "CSRF token missing in cookie")
			c.Abort()
			return
		}

		headerToken := c.GetHeader("X-CSRF-Token")
		if headerToken == "" {
			response.Forbidden(c, "CSRF token missing in header")
			c.Abort()
			return
		}

		if headerToken != cookieToken {
			response.Forbidden(c, "CSRF token mismatch")
			c.Abort()
			return
		}

		c.Next()
	}
}
