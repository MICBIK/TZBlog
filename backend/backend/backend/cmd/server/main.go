package main

import (
	"log"

	"github.com/MICBIK/TZBlog/backend/config"
	"github.com/MICBIK/TZBlog/backend/internal/api/handlers"
	"github.com/MICBIK/TZBlog/backend/internal/api/middleware"
	"github.com/MICBIK/TZBlog/backend/internal/api/routes"
	"github.com/MICBIK/TZBlog/backend/internal/repository/postgres"
	"github.com/MICBIK/TZBlog/backend/pkg/database"
	"github.com/MICBIK/TZBlog/backend/pkg/logger"
	"github.com/MICBIK/TZBlog/backend/pkg/storage"
	"github.com/gin-gonic/gin"
)

func main() {
	// 初始化日志
	if err := logger.Init(); err != nil {
		log.Fatal("Failed to initialize logger:", err)
	}

	// 加载配置
	cfg, err := config.Load("config/config.yaml")
	if err != nil {
		logger.Fatal("Failed to load config: " + err.Error())
	}

	// 初始化数据库
	db, err := database.InitDB(&cfg.Database)
	if err != nil {
		logger.Fatal("Failed to connect to database: " + err.Error())
	}

	// 初始化Redis
	redisClient, err := database.InitRedis(&cfg.Redis)
	if err != nil {
		logger.Fatal("Failed to connect to Redis: " + err.Error())
	}
	_ = redisClient // Redis 将在后续版本使用

	// 初始化R2 Storage
	r2Storage, err := storage.NewR2Storage(storage.R2Config{
		AccountID:       cfg.Storage.R2.AccountID,
		AccessKeyID:     cfg.Storage.R2.AccessKeyID,
		SecretAccessKey: cfg.Storage.R2.SecretAccessKey,
		Bucket:          cfg.Storage.R2.Bucket,
		PublicURL:       cfg.Storage.R2.PublicURL,
	})
	if err != nil {
		logger.Fatal("Failed to initialize R2 storage: " + err.Error())
	}

	// 初始化Repository
	userRepo := postgres.NewUserRepository(db)
	articleRepo := postgres.NewArticleRepository(db)
	categoryRepo := postgres.NewCategoryRepository(db)
	tagRepo := postgres.NewTagRepository(db)
	commentRepo := postgres.NewCommentRepository(db)
	likeRepo := postgres.NewLikeRepository(db)
	viewRepo := postgres.NewViewRepository(db)
	progressRepo := postgres.NewProgressRepository(db)
	statsRepo := postgres.NewStatsRepository(db)

	// 初始化Handler
	authHandler := handlers.NewAuthHandler(userRepo, cfg.JWT.Secret, "168h")
	articleHandler := handlers.NewArticleHandler(articleRepo)
	categoryHandler := handlers.NewCategoryHandler(categoryRepo)
	tagHandler := handlers.NewTagHandler(tagRepo)
	commentHandler := handlers.NewCommentHandler(commentRepo)
	likeHandler := handlers.NewLikeHandler(likeRepo)
	viewHandler := handlers.NewViewHandler(viewRepo)
	progressHandler := handlers.NewProgressHandler(progressRepo)
	statsHandler := handlers.NewStatsHandler(statsRepo)
	uploadHandler := handlers.NewUploadHandler(r2Storage)

	// 设置Gin模式
	gin.SetMode(cfg.Server.Mode)

	// 创建路由
	router := gin.New()

	// 全局中间件
	router.Use(middleware.Logger())
	router.Use(middleware.Recovery())
	router.Use(middleware.CORS())
	router.Use(middleware.RequestID())

	// 注册路由
	routes.RegisterRoutes(router, routes.Handlers{
		Auth:     authHandler,
		Article:  articleHandler,
		Category: categoryHandler,
		Tag:      tagHandler,
		Comment:  commentHandler,
		Like:     likeHandler,
		View:     viewHandler,
		Progress: progressHandler,
		Stats:    statsHandler,
		Upload:   uploadHandler,
	}, cfg.JWT.Secret)

	// 启动服务器
	logger.Info("Starting server on port " + cfg.Server.Port)
	if err := router.Run(":" + cfg.Server.Port); err != nil {
		logger.Fatal("Failed to start server: " + err.Error())
	}
}
