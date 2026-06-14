package middleware_test

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/MICBIK/TZBlog/backend/internal/api/middleware"
	"github.com/MICBIK/TZBlog/backend/internal/cache"
	"github.com/MICBIK/TZBlog/backend/pkg/auth"
	"github.com/alicebob/miniredis/v2"
	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
	"github.com/stretchr/testify/assert"
)

func setupTestRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	return gin.New()
}

func setupTestRedis(t *testing.T) (*redis.Client, func()) {
	s, err := miniredis.Run()
	if err != nil {
		t.Fatal(err)
	}

	client := redis.NewClient(&redis.Options{
		Addr: s.Addr(),
	})

	return client, func() {
		client.Close()
		s.Close()
	}
}

func TestAuthMiddleware_ValidToken(t *testing.T) {
	// Arrange
	router := setupTestRouter()
	redisClient, cleanup := setupTestRedis(t)
	defer cleanup()

	secret := "test-secret-key-for-testing-purposes-only"
	jwtAuth := auth.NewJWTAuth(secret, 3600*time.Second)
	tokenBlacklist := cache.NewTokenBlacklist(redisClient)

	token, err := jwtAuth.GenerateToken(1, "user")
	if !assert.NoError(t, err) {
		t.Fatalf("Failed to generate token: %v", err)
	}

	// Verify the token can be validated with the same secret
	claims, err := auth.ValidateToken(token, secret)
	if !assert.NoError(t, err) {
		t.Fatalf("Failed to validate token: %v", err)
	}
	assert.NotNil(t, claims)
	assert.Equal(t, int64(1), claims.UserID)
	assert.Equal(t, "user", claims.Role)

	router.GET("/protected", middleware.AuthMiddleware(secret, tokenBlacklist), func(c *gin.Context) {
		userID := c.GetInt64("user_id")
		userRole := c.GetString("user_role")
		c.JSON(200, gin.H{
			"user_id":   userID,
			"user_role": userRole,
		})
	})

	req := httptest.NewRequest("GET", "/protected", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	w := httptest.NewRecorder()

	// Act
	router.ServeHTTP(w, req)

	// Assert
	if w.Code != http.StatusOK {
		t.Logf("Response body: %s", w.Body.String())
	}
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAuthMiddleware_MissingToken(t *testing.T) {
	// Arrange
	router := setupTestRouter()
	redisClient, cleanup := setupTestRedis(t)
	defer cleanup()

	secret := "test-secret-key"
	tokenBlacklist := cache.NewTokenBlacklist(redisClient)

	router.GET("/protected", middleware.AuthMiddleware(secret, tokenBlacklist), func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "success"})
	})

	req := httptest.NewRequest("GET", "/protected", nil)
	w := httptest.NewRecorder()

	// Act
	router.ServeHTTP(w, req)

	// Assert
	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestAuthMiddleware_InvalidFormat(t *testing.T) {
	// Arrange
	router := setupTestRouter()
	redisClient, cleanup := setupTestRedis(t)
	defer cleanup()

	secret := "test-secret-key"
	tokenBlacklist := cache.NewTokenBlacklist(redisClient)

	router.GET("/protected", middleware.AuthMiddleware(secret, tokenBlacklist), func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "success"})
	})

	req := httptest.NewRequest("GET", "/protected", nil)
	req.Header.Set("Authorization", "InvalidFormat token123")
	w := httptest.NewRecorder()

	// Act
	router.ServeHTTP(w, req)

	// Assert
	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestAuthMiddleware_InvalidToken(t *testing.T) {
	// Arrange
	router := setupTestRouter()
	redisClient, cleanup := setupTestRedis(t)
	defer cleanup()

	secret := "test-secret-key"
	tokenBlacklist := cache.NewTokenBlacklist(redisClient)

	router.GET("/protected", middleware.AuthMiddleware(secret, tokenBlacklist), func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "success"})
	})

	req := httptest.NewRequest("GET", "/protected", nil)
	req.Header.Set("Authorization", "Bearer invalid.token.here")
	w := httptest.NewRecorder()

	// Act
	router.ServeHTTP(w, req)

	// Assert
	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestAuthMiddleware_ExpiredToken(t *testing.T) {
	// Arrange
	router := setupTestRouter()
	redisClient, cleanup := setupTestRedis(t)
	defer cleanup()

	secret := "test-secret-key-for-testing-purposes-only"
	jwtAuth := auth.NewJWTAuth(secret, -1*time.Second) // Expired immediately
	tokenBlacklist := cache.NewTokenBlacklist(redisClient)

	token, err := jwtAuth.GenerateToken(1, "user")
	assert.NoError(t, err)

	time.Sleep(2 * time.Second)

	router.GET("/protected", middleware.AuthMiddleware(secret, tokenBlacklist), func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "success"})
	})

	req := httptest.NewRequest("GET", "/protected", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	w := httptest.NewRecorder()

	// Act
	router.ServeHTTP(w, req)

	// Assert
	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestAuthMiddleware_RevokedToken(t *testing.T) {
	// Arrange
	router := setupTestRouter()
	redisClient, cleanup := setupTestRedis(t)
	defer cleanup()

	secret := "test-secret-key-for-testing-purposes-only"
	jwtAuth := auth.NewJWTAuth(secret, 3600*time.Second)
	tokenBlacklist := cache.NewTokenBlacklist(redisClient)

	token, err := jwtAuth.GenerateToken(1, "user")
	assert.NoError(t, err)

	claims, err := auth.ValidateToken(token, secret)
	if !assert.NoError(t, err) || claims == nil {
		t.Fatal("Failed to validate token or claims is nil")
	}

	err = tokenBlacklist.Revoke(claims.JTI, time.Hour)
	assert.NoError(t, err)

	router.GET("/protected", middleware.AuthMiddleware(secret, tokenBlacklist), func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "success"})
	})

	req := httptest.NewRequest("GET", "/protected", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	w := httptest.NewRecorder()

	// Act
	router.ServeHTTP(w, req)

	// Assert
	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestOptionalAuthMiddleware_WithValidToken(t *testing.T) {
	// Arrange
	router := setupTestRouter()
	redisClient, cleanup := setupTestRedis(t)
	defer cleanup()

	secret := "test-secret-key-for-testing-purposes-only"
	jwtAuth := auth.NewJWTAuth(secret, 3600*time.Second)
	tokenBlacklist := cache.NewTokenBlacklist(redisClient)

	token, err := jwtAuth.GenerateToken(1, "user")
	assert.NoError(t, err)

	router.GET("/public", middleware.OptionalAuthMiddleware(secret, tokenBlacklist), func(c *gin.Context) {
		userID := c.GetInt64("user_id")
		c.JSON(200, gin.H{"user_id": userID})
	})

	req := httptest.NewRequest("GET", "/public", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	w := httptest.NewRecorder()

	// Act
	router.ServeHTTP(w, req)

	// Assert
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestOptionalAuthMiddleware_WithoutToken(t *testing.T) {
	// Arrange
	router := setupTestRouter()
	redisClient, cleanup := setupTestRedis(t)
	defer cleanup()

	secret := "test-secret-key"
	tokenBlacklist := cache.NewTokenBlacklist(redisClient)

	router.GET("/public", middleware.OptionalAuthMiddleware(secret, tokenBlacklist), func(c *gin.Context) {
		userID := c.GetInt64("user_id")
		c.JSON(200, gin.H{"user_id": userID})
	})

	req := httptest.NewRequest("GET", "/public", nil)
	w := httptest.NewRecorder()

	// Act
	router.ServeHTTP(w, req)

	// Assert
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestOptionalAuthMiddleware_WithInvalidToken(t *testing.T) {
	// Arrange
	router := setupTestRouter()
	redisClient, cleanup := setupTestRedis(t)
	defer cleanup()

	secret := "test-secret-key"
	tokenBlacklist := cache.NewTokenBlacklist(redisClient)

	router.GET("/public", middleware.OptionalAuthMiddleware(secret, tokenBlacklist), func(c *gin.Context) {
		userID := c.GetInt64("user_id")
		c.JSON(200, gin.H{"user_id": userID})
	})

	req := httptest.NewRequest("GET", "/public", nil)
	req.Header.Set("Authorization", "Bearer invalid.token")
	w := httptest.NewRecorder()

	// Act
	router.ServeHTTP(w, req)

	// Assert
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestOptionalAuthMiddleware_WithRevokedToken(t *testing.T) {
	// Arrange
	router := setupTestRouter()
	redisClient, cleanup := setupTestRedis(t)
	defer cleanup()

	secret := "test-secret-key-for-testing-purposes-only"
	jwtAuth := auth.NewJWTAuth(secret, 3600*time.Second)
	tokenBlacklist := cache.NewTokenBlacklist(redisClient)

	token, err := jwtAuth.GenerateToken(1, "user")
	assert.NoError(t, err)

	claims, err := auth.ValidateToken(token, secret)
	if !assert.NoError(t, err) || claims == nil {
		t.Fatal("Failed to validate token or claims is nil")
	}

	err = tokenBlacklist.Revoke(claims.JTI, time.Hour)
	assert.NoError(t, err)

	router.GET("/public", middleware.OptionalAuthMiddleware(secret, tokenBlacklist), func(c *gin.Context) {
		userID := c.GetInt64("user_id")
		c.JSON(200, gin.H{"user_id": userID})
	})

	req := httptest.NewRequest("GET", "/public", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	w := httptest.NewRecorder()

	// Act
	router.ServeHTTP(w, req)

	// Assert
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAuthMiddleware_NilTokenBlacklist(t *testing.T) {
	// Arrange
	router := setupTestRouter()
	secret := "test-secret-key-for-testing-purposes-only"
	jwtAuth := auth.NewJWTAuth(secret, 3600*time.Second)

	token, err := jwtAuth.GenerateToken(1, "user")
	assert.NoError(t, err)

	router.GET("/protected", middleware.AuthMiddleware(secret, nil), func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "success"})
	})

	req := httptest.NewRequest("GET", "/protected", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	w := httptest.NewRecorder()

	// Act
	router.ServeHTTP(w, req)

	// Assert
	assert.Equal(t, http.StatusOK, w.Code)
}
