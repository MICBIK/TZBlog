package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/MICBIK/TZBlog/backend/config"
	"github.com/MICBIK/TZBlog/backend/internal/api/handlers"
	"github.com/MICBIK/TZBlog/backend/internal/api/middleware"
	"github.com/MICBIK/TZBlog/backend/pkg/logger"
	"github.com/gin-gonic/gin"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"
)

func main() {
	// 初始化日志
	env := os.Getenv("APP_ENV")
	if env == "" {
		env = "development"
	}

	if err := logger.Init(env); err != nil {
		log.Fatalf("Failed to initialize logger: %v", err)
	}
	defer logger.Sync()

	logger.Info("Starting TZBlog backend service", zap.String("env", env))

	// 加载配置
	cfg := &config.DatabaseConfig{
		Host:     getEnv("DB_HOST", "localhost"),
		Port:     5432,
		User:     getEnv("DB_USER", "postgres"),
		Password: getEnv("DB_PASSWORD", ""),
		DBName:   getEnv("DB_NAME", "tzblog"),
	}

	// 连接数据库
	poolCfg := config.DefaultDatabasePoolConfig()
	db, err := config.NewDatabaseConnection(cfg, poolCfg)
	if err != nil {
		logger.Fatal("Failed to connect to database", zap.Error(err))
	}
	logger.Info("Database connected successfully")

	// 连接 Redis
	redisClient := redis.NewClient(&redis.Options{
		Addr:     getEnv("REDIS_ADDR", "localhost:6379"),
		Password: getEnv("REDIS_PASSWORD", ""),
		DB:       0,
	})

	if err := redisClient.Ping(context.Background()).Err(); err != nil {
		logger.Warn("Failed to connect to Redis", zap.Error(err))
	} else {
		logger.Info("Redis connected successfully")
	}

	// 设置 Gin
	if env == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.New()

	// 注册中间件
	r.Use(middleware.RecoveryLogger())
	r.Use(middleware.RequestLogger())
	r.Use(middleware.Metrics())

	// 健康检查端点
	healthHandler := handlers.NewHealthHandlerWithDeps(db, redisClient)
	r.GET("/health", healthHandler.HealthCheck)
	r.GET("/health/ready", healthHandler.Readiness)
	r.GET("/health/live", healthHandler.Liveness)

	// Prometheus 指标端点
	r.GET("/metrics", gin.WrapH(promhttp.Handler()))

	// 示例 API 端点
	r.GET("/ping", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message": "pong",
			"time":    time.Now().Unix(),
		})
	})

	// 启动服务器
	port := getEnv("PORT", "8080")
	srv := &http.Server{
		Addr:    ":" + port,
		Handler: r,
	}

	// 优雅关闭
	go func() {
		logger.Info("Server starting", zap.String("port", port))
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Fatal("Server failed to start", zap.Error(err))
		}
	}()

	// 等待中断信号
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logger.Info("Shutting down server...")

	// 5秒超时关闭
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		logger.Fatal("Server forced to shutdown", zap.Error(err))
	}

	logger.Info("Server exited")
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
