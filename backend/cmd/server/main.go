package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/MICBIK/TZBlog/backend/config"
	"github.com/MICBIK/TZBlog/backend/internal/api/handlers"
	"github.com/MICBIK/TZBlog/backend/internal/api/middleware"
	"github.com/MICBIK/TZBlog/backend/internal/cache"
	"github.com/MICBIK/TZBlog/backend/internal/repository/postgres"
	"github.com/MICBIK/TZBlog/backend/pkg/auth"
	"github.com/MICBIK/TZBlog/backend/pkg/logger"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

func main() {
	// Initialize logger
	env := "development"
	if os.Getenv("APP_ENV") != "" {
		env = os.Getenv("APP_ENV")
	}
	if err := logger.Init(env); err != nil {
		log.Fatalf("Failed to initialize logger: %v", err)
	}
	defer logger.Sync()

	// Load configuration
	cfg, err := config.Load("")
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	// Set Gin mode
	if cfg.IsProduction() {
		gin.SetMode(gin.ReleaseMode)
	} else {
		gin.SetMode(gin.DebugMode)
	}

	// Initialize database connection
	poolCfg := config.DefaultDatabasePoolConfig()
	db, err := config.NewDatabaseConnection(&cfg.Database, poolCfg)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		log.Fatalf("Failed to get sql.DB: %v", err)
	}
	defer sqlDB.Close()

	logger.Info("Database connected successfully")

	// Initialize Redis client
	redisClient, err := config.NewRedisClient(&cfg.Redis)
	if err != nil {
		log.Fatalf("Failed to connect to Redis: %v", err)
	}
	defer redisClient.Close()

	logger.Info("Redis connected successfully")

	// Initialize JWT auth
	jwtExpiry, err := time.ParseDuration(cfg.JWT.Expiry)
	if err != nil {
		log.Fatalf("Invalid JWT expiry duration: %v", err)
	}
	jwtAuth := auth.NewJWTAuth(cfg.JWT.Secret, jwtExpiry)

	// Initialize token blacklist
	tokenBlacklist := cache.NewTokenBlacklist(redisClient)

	// Initialize repositories
	userRepo := postgres.NewUserRepository(db)
	articleRepo := postgres.NewArticleRepositoryAdapter(db)
	categoryRepo := postgres.NewCategoryRepository(db)
	tagRepo := postgres.NewTagRepository(db)
	commentRepo := postgres.NewCommentRepository(db)
	// Note: These are initialized but not used yet - will be needed for future features
	_ = postgres.NewLikeRepository(db)
	_ = postgres.NewViewRepository(db)
	_ = postgres.NewProgressRepository(db)
	_ = postgres.NewFollowRepository(db)

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(userRepo, jwtAuth)
	articleHandler := handlers.NewArticleHandler(articleRepo)
	categoryHandler := handlers.NewCategoryHandler(categoryRepo)
	tagHandler := handlers.NewTagHandler(tagRepo)
	commentHandler := handlers.NewCommentHandler(commentRepo)

	// Initialize Gin router
	router := gin.New()

	// Register global middlewares (order matters)
	router.Use(middleware.RequestLogger())    // 1. Logging
	router.Use(middleware.RecoveryLogger())   // 2. Recovery
	router.Use(gin.Recovery())                // 3. Gin's default recovery
	router.Use(RequestID())                   // 4. Request ID

	// CORS middleware
	if cfg.IsDevelopment() {
		router.Use(middleware.DevelopmentCORS())
		logger.Warn("Using development CORS (permissive) - DO NOT USE IN PRODUCTION")
	} else {
		// Production: use whitelist CORS
		allowedOrigins := []string{"https://yourdomain.com"} // Configure this
		router.Use(middleware.CORS(allowedOrigins))
	}

	// Global rate limiter
	router.Use(middleware.IPRateLimiter(100, 200)) // 100 req/sec, burst 200

	// Health check routes (no auth required)
	router.GET("/health", HealthCheck(db, redisClient))
	router.GET("/ready", ReadinessCheck(db, redisClient))

	// API v1 routes
	v1 := router.Group("/api/v1")
	{
		// Auth routes (public)
		auth := v1.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
			auth.POST("/logout", authHandler.Logout)

			// Protected auth routes
			authProtected := auth.Group("")
			authProtected.Use(middleware.AuthMiddleware(cfg.JWT.Secret, tokenBlacklist))
			{
				authProtected.GET("/me", authHandler.GetCurrentUser)
				authProtected.PUT("/profile", authHandler.UpdateProfile)
				authProtected.POST("/change-password", authHandler.ChangePassword)
			}
		}

		// Article routes
		articles := v1.Group("/articles")
		{
			// Public routes
			articles.GET("", articleHandler.ListArticles)
			articles.GET("/:slug", articleHandler.GetArticleBySlug)

			// Protected routes (admin only)
			articlesProtected := articles.Group("")
			articlesProtected.Use(middleware.AuthMiddleware(cfg.JWT.Secret, tokenBlacklist))
			articlesProtected.Use(AdminOnly()) // TODO: implement role check
			{
				articlesProtected.POST("", articleHandler.CreateArticle)
				articlesProtected.PUT("/:id", articleHandler.UpdateArticle)
				articlesProtected.DELETE("/:id", articleHandler.DeleteArticle)
			}
		}

		// Category routes
		categories := v1.Group("/categories")
		{
			// Public routes
			categories.GET("", categoryHandler.List)
			categories.GET("/:id", categoryHandler.GetByID)

			// Protected routes (admin only)
			categoriesProtected := categories.Group("")
			categoriesProtected.Use(middleware.AuthMiddleware(cfg.JWT.Secret, tokenBlacklist))
			categoriesProtected.Use(AdminOnly())
			{
				categoriesProtected.POST("", categoryHandler.Create)
			}
		}

		// Tag routes
		tags := v1.Group("/tags")
		{
			// Public routes
			tags.GET("", tagHandler.List)
			tags.GET("/:id", tagHandler.GetByID)

			// Protected routes (admin only)
			tagsProtected := tags.Group("")
			tagsProtected.Use(middleware.AuthMiddleware(cfg.JWT.Secret, tokenBlacklist))
			tagsProtected.Use(AdminOnly())
			{
				tagsProtected.POST("", tagHandler.Create)
			}
		}

		// Comment routes
		comments := v1.Group("/comments")
		{
			// Public routes
			comments.GET("", commentHandler.ListComments)
			comments.GET("/:id", commentHandler.GetComment)

			// Protected routes (requires auth)
			commentsProtected := comments.Group("")
			commentsProtected.Use(middleware.AuthMiddleware(cfg.JWT.Secret, tokenBlacklist))
			{
				commentsProtected.POST("", commentHandler.CreateComment)
				commentsProtected.PUT("/:id", commentHandler.UpdateComment)
				commentsProtected.DELETE("/:id", commentHandler.DeleteComment)
			}
		}
	}

	// Start server
	port := cfg.Server.Port
	if port == "" {
		port = "8080"
	}

	srv := &http.Server{
		Addr:           ":" + port,
		Handler:        router,
		ReadTimeout:    10 * time.Second,
		WriteTimeout:   10 * time.Second,
		MaxHeaderBytes: 1 << 20, // 1 MB
	}

	// Graceful shutdown
	go func() {
		logger.Info("Starting server", zap.String("port", port))
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	// Wait for interrupt signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logger.Info("Shutting down server...")

	// Graceful shutdown with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		logger.Fatal("Server forced to shutdown", zap.Error(err))
	}

	logger.Info("Server exited")
}

// RequestID middleware adds a unique request ID to each request
func RequestID() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Check if request ID is provided
		requestID := c.GetHeader("X-Request-ID")
		if requestID == "" {
			requestID = generateRequestID()
		}

		c.Set("request_id", requestID)
		c.Writer.Header().Set("X-Request-ID", requestID)
		c.Next()
	}
}

// generateRequestID generates a simple request ID
func generateRequestID() string {
	return fmt.Sprintf("%d", time.Now().UnixNano())
}

// HealthCheck returns a handler for health check
func HealthCheck(db interface{}, redis interface{}) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "ok",
			"time":   time.Now().Unix(),
		})
	}
}

// ReadinessCheck returns a handler for readiness check
func ReadinessCheck(db interface{}, redis interface{}) gin.HandlerFunc {
	return func(c *gin.Context) {
		// TODO: check database and Redis connectivity
		c.JSON(http.StatusOK, gin.H{
			"status": "ready",
			"time":   time.Now().Unix(),
		})
	}
}

// AdminOnly middleware checks if user has admin role
func AdminOnly() gin.HandlerFunc {
	return func(c *gin.Context) {
		role, exists := c.Get("user_role")
		if !exists || role != "admin" {
			c.JSON(http.StatusForbidden, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "FORBIDDEN",
					"message": "Admin access required",
				},
			})
			c.Abort()
			return
		}
		c.Next()
	}
}
