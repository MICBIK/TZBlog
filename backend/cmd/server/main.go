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
	"github.com/MICBIK/TZBlog/backend/internal/monitoring"
	"github.com/MICBIK/TZBlog/backend/internal/repository/postgres"
	"github.com/MICBIK/TZBlog/backend/internal/service"
	"github.com/MICBIK/TZBlog/backend/pkg/auth"
	"github.com/MICBIK/TZBlog/backend/pkg/logger"
	"github.com/MICBIK/TZBlog/backend/pkg/storage"
	"github.com/gin-gonic/gin"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"go.uber.org/zap"
)

// @title           TZBlog API
// @version         1.0
// @description     TZBlog 后端 API 文档
// @termsOfService  http://swagger.io/terms/

// @contact.name   API Support
// @contact.email  support@tzblog.com

// @license.name  MIT
// @license.url   https://opensource.org/licenses/MIT

// @host      localhost:8080
// @BasePath  /api/v1

// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
// @description Type "Bearer" followed by a space and JWT token.

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

	// ✅ C-006: Start connection pool monitor
	poolMonitor := config.NewConnectionPoolMonitor(
		sqlDB,
		config.DefaultPoolAlertThresholds(),
	)

	monitorCtx, cancelMonitor := context.WithCancel(context.Background())
	defer cancelMonitor()

	go poolMonitor.Start(monitorCtx)
	logger.Info("Connection pool monitor started")

	// Start Prometheus metrics updater for DB stats
	go func() {
		ticker := time.NewTicker(15 * time.Second)
		defer ticker.Stop()
		for {
			select {
			case <-monitorCtx.Done():
				return
			case <-ticker.C:
				monitoring.UpdateDBMetrics(sqlDB.Stats())
			}
		}
	}()
	logger.Info("Prometheus DB metrics updater started")

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
	articleRepo := postgres.NewArticleRepository(db)
	categoryRepo := postgres.NewCategoryRepository(db)
	tagRepo := postgres.NewTagRepository(db)
	commentRepo := postgres.NewCommentRepository(db)
	likeRepo := postgres.NewLikeRepository(db)
	// Note: These are initialized but not used yet - will be needed for future features
	_ = postgres.NewViewRepository(db)
	_ = postgres.NewProgressRepository(db)
	_ = postgres.NewFollowRepository(db)

	// Initialize services
	authService := service.NewAuthService(userRepo, jwtAuth)
	articleService := service.NewArticleService(articleRepo, tagRepo)
	commentService := service.NewCommentService(commentRepo)

	// Initialize R2 storage
	r2Storage, err := storage.NewR2Storage(&cfg.Storage.R2)
	if err != nil {
		logger.Warn("R2 storage not configured, uploads will fail", zap.Error(err))
		// In development, we can continue without R2
		// In production, you might want to fail here
	}

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(authService)
	articleHandler := handlers.NewArticleHandler(articleService)
	categoryHandler := handlers.NewCategoryHandler(categoryRepo)
	tagHandler := handlers.NewTagHandler(tagRepo)
	commentHandler := handlers.NewCommentHandler(commentService)
	likeHandler := handlers.NewLikeHandler(likeRepo)
	storageHandler := handlers.NewStorageHandler(r2Storage)
	systemHandler := handlers.NewSystemHandler()

	// Initialize Gin router
	router := gin.New()

	// Register global middlewares (order matters)
	router.Use(middleware.RequestLogger())    // 1. Logging
	router.Use(middleware.RecoveryLogger())   // 2. Recovery
	router.Use(gin.Recovery())                // 3. Gin's default recovery
	router.Use(RequestID())                   // 4. Request ID
	router.Use(monitoring.HTTPMetricsMiddleware()) // 5. Prometheus metrics

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
	router.GET("/metrics", gin.WrapH(promhttp.Handler()))

	// API v1 routes
	v1 := router.Group("/api/v1")
	// ✅ SEC-002 FIX: Apply CSRF protection to all API routes
	v1.Use(middleware.OptionalCSRF())
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
				authProtected.PUT("/password", authHandler.ChangePassword) // ✅ P0-1: 修复 RESTful 规范，修改密码应使用 PUT
			}
		}

		// Article routes
		articles := v1.Group("/articles")
		{
			// Public routes
			articles.GET("", articleHandler.ListArticles)

			// Article by ID routes (for internal operations)
			articlesById := articles.Group("/by-id")
			{
				articlesById.GET("/:id/comments", commentHandler.ListArticleComments)
			}

			// Article by slug (must be last to avoid conflicts)
			articles.GET("/:slug", articleHandler.GetArticleBySlug)

			// Protected routes (admin only, use slug for SEO-friendly updates)
			articlesProtected := articles.Group("")
			articlesProtected.Use(middleware.AuthMiddleware(cfg.JWT.Secret, tokenBlacklist))
			articlesProtected.Use(AdminOnly())
			{
				articlesProtected.POST("", articleHandler.CreateArticle)
				articlesProtected.PUT("/:slug", articleHandler.UpdateArticle)
				articlesProtected.PATCH("/:slug", articleHandler.PatchArticle)
				articlesProtected.DELETE("/:slug", articleHandler.DeleteArticle)

				// Batch operations
				articlesProtected.DELETE("/batch", articleHandler.BatchDelete)
				articlesProtected.PUT("/batch/status", articleHandler.BatchUpdateStatus)
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

		// Like routes (C3 fix)
		likes := v1.Group("/likes")
		{
			// Protected routes (requires auth)
			likesProtected := likes.Group("")
			likesProtected.Use(middleware.AuthMiddleware(cfg.JWT.Secret, tokenBlacklist))
			{
				// Article likes
				likesProtected.POST("/articles/:id", likeHandler.LikeArticle)
				likesProtected.DELETE("/articles/:id", likeHandler.UnlikeArticle)
				likesProtected.GET("/articles/:id/status", likeHandler.GetLikeStatus)

				// Comment likes
				likesProtected.POST("/comments/:id", likeHandler.LikeComment)
				likesProtected.DELETE("/comments/:id", likeHandler.UnlikeComment)
				likesProtected.GET("/comments/:id/status", likeHandler.GetCommentLikeStatus)
			}
		}

		// Upload routes (C4 fix)
		uploads := v1.Group("/uploads")
		{
			// Public config endpoint
			uploads.GET("/config", storageHandler.GetUploadConfig)

			// Protected routes (requires auth)
			uploadsProtected := uploads.Group("")
			uploadsProtected.Use(middleware.AuthMiddleware(cfg.JWT.Secret, tokenBlacklist))
			{
				uploadsProtected.POST("/images", storageHandler.UploadImage)
			}
		}

		// System routes (admin only)
		system := v1.Group("/system")
		system.Use(middleware.AuthMiddleware(cfg.JWT.Secret, tokenBlacklist))
		system.Use(AdminOnly())
		{
			system.PUT("/log-level", systemHandler.SetLogLevel)
			system.GET("/log-level", systemHandler.GetLogLevel)
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
