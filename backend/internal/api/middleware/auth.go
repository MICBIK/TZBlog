package middleware

import (
	"strings"

	"github.com/MICBIK/TZBlog/backend/internal/api/response"
	"github.com/MICBIK/TZBlog/backend/internal/cache"
	"github.com/MICBIK/TZBlog/backend/pkg/auth"
	"github.com/gin-gonic/gin"
)

// AuthMiddleware validates JWT tokens and checks revocation
func AuthMiddleware(secret string, tokenBlacklist *cache.TokenBlacklist) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			response.Unauthorized(c, "Authorization header required")
			c.Abort()
			return
		}

		// Check Bearer format
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			response.Unauthorized(c, "Invalid authorization format")
			c.Abort()
			return
		}

		tokenString := parts[1]

		// Validate token
		claims, err := auth.ValidateToken(tokenString, secret)
		if err != nil {
			response.Unauthorized(c, "Invalid or expired token")
			c.Abort()
			return
		}

		// ✅ SEC-002 FIX: Check if token is revoked
		if tokenBlacklist != nil && tokenBlacklist.IsRevoked(claims.JTI) {
			response.Unauthorized(c, "Token has been revoked")
			c.Abort()
			return
		}

		// Set user context
		c.Set("user_id", claims.UserID)
		c.Set("user_role", claims.Role)
		c.Set("jti", claims.JTI)

		c.Next()
	}
}

// OptionalAuthMiddleware validates JWT tokens if present but doesn't require them
func OptionalAuthMiddleware(secret string, tokenBlacklist *cache.TokenBlacklist) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.Next()
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.Next()
			return
		}

		tokenString := parts[1]
		claims, err := auth.ValidateToken(tokenString, secret)
		if err != nil {
			c.Next()
			return
		}

		// Check revocation
		if tokenBlacklist != nil && tokenBlacklist.IsRevoked(claims.JTI) {
			c.Next()
			return
		}

		// Set user context if token is valid
		c.Set("user_id", claims.UserID)
		c.Set("user_role", claims.Role)
		c.Set("jti", claims.JTI)

		c.Next()
	}
}
