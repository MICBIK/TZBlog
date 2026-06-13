package main

import (
	"log"
	"os"

	"github.com/MICBIK/TZBlog/backend/internal/api/routes"
	"github.com/MICBIK/TZBlog/backend/pkg/logger"
	"github.com/gin-gonic/gin"
)

func main() {
	// 初始化日志
	if err := logger.Init(); err != nil {
		log.Fatal("Failed to initialize logger:", err)
	}

	// 设置Gin模式
	mode := os.Getenv("GIN_MODE")
	if mode == "" {
		mode = gin.DebugMode
	}
	gin.SetMode(mode)

	// 创建路由
	router := gin.Default()

	// 注册路由
	routes.RegisterRoutes(router)

	// 启动服务器
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	logger.Info("Starting server on port " + port)
	if err := router.Run(":" + port); err != nil {
		logger.Fatal("Failed to start server: " + err.Error())
	}
}
