package routes

import (
	"net/http"

	"github.com/MICBIK/TZBlog/backend/internal/api/handlers"
	"github.com/MICBIK/TZBlog/backend/internal/api/middleware"
	"github.com/gin-gonic/gin"
)

type Handlers struct {
	Auth     *handlers.AuthHandler
	Article  *handlers.ArticleHandler
	Category *handlers.CategoryHandler
	Tag      *handlers.TagHandler
	Comment  *handlers.CommentHandler
	Like     *handlers.LikeHandler
	View     *handlers.ViewHandler
	Progress *handlers.ProgressHandler
	Stats    *handlers.StatsHandler
	Upload   *handlers.UploadHandler
}

func RegisterRoutes(router *gin.Engine, h Handlers, jwtSecret string) {
	// 健康检查
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	// API v1
	v1 := router.Group("/api/v1")
	{
		// 认证路由（公开）
		auth := v1.Group("/auth")
		{
			auth.POST("/register", h.Auth.Register)
			auth.POST("/login", h.Auth.Login)
			auth.GET("/me", middleware.Auth(jwtSecret), h.Auth.GetCurrentUser)
		}

		// 文章路由
		articles := v1.Group("/articles")
		{
			articles.GET("", h.Article.ListArticles)          // 公开
			articles.GET("/:slug", h.Article.GetArticle)      // 公开
			articles.POST("", middleware.Auth(jwtSecret),
				middleware.RequireRole("admin", "author"), h.Article.CreateArticle)
			articles.PUT("/:id", middleware.Auth(jwtSecret), h.Article.UpdateArticle)
			articles.DELETE("/:id", middleware.Auth(jwtSecret), h.Article.DeleteArticle)

			// 文章评论
			articles.POST("/:id/comments", middleware.Auth(jwtSecret), h.Comment.CreateComment)
			articles.GET("/:id/comments", h.Comment.ListComments)

			// 文章点赞
			articles.POST("/:id/like", middleware.Auth(jwtSecret), h.Like.ToggleArticleLike)

			// 阅读进度
			articles.POST("/:id/progress", middleware.Auth(jwtSecret), h.Progress.RecordProgress)
			articles.GET("/:id/progress", middleware.Auth(jwtSecret), h.Progress.GetProgress)
		}

		// 评论路由
		comments := v1.Group("/comments")
		{
			comments.DELETE("/:id", middleware.Auth(jwtSecret), h.Comment.DeleteComment)
			comments.POST("/:id/like", middleware.Auth(jwtSecret), h.Like.ToggleCommentLike)
		}

		// 分类路由
		categories := v1.Group("/categories")
		{
			categories.GET("", h.Category.ListCategories)
			categories.POST("", middleware.Auth(jwtSecret),
				middleware.RequireRole("admin"), h.Category.CreateCategory)
		}

		// 标签路由
		tags := v1.Group("/tags")
		{
			tags.GET("", h.Tag.ListTags)
			tags.POST("", middleware.Auth(jwtSecret),
				middleware.RequireRole("admin"), h.Tag.CreateTag)
		}

		// 上传路由
		upload := v1.Group("/upload")
		{
			upload.POST("/image", middleware.Auth(jwtSecret), h.Upload.UploadImage)
		}

		// 后台统计路由
		admin := v1.Group("/admin")
		admin.Use(middleware.Auth(jwtSecret), middleware.RequireRole("admin"))
		{
			stats := admin.Group("/stats")
			{
				stats.GET("/overview", h.Stats.GetOverviewStats)
				stats.GET("/articles", h.Stats.GetArticleStats)
				stats.GET("/traffic", h.Stats.GetTrafficStats)
			}
		}

		// 浏览统计
		v1.GET("/hot-articles", h.View.GetHotArticles)
	}
}
