package handlers

import (
	"net/http"
	"strconv"

	"github.com/MICBIK/TZBlog/backend/internal/domain/article"
	"github.com/MICBIK/TZBlog/backend/pkg/response"
	"github.com/gin-gonic/gin"
	"github.com/gosimple/slug"
)

type ArticleHandler struct {
	articleRepo article.ArticleRepository
}

func NewArticleHandler(articleRepo article.ArticleRepository) *ArticleHandler {
	return &ArticleHandler{articleRepo: articleRepo}
}

type CreateArticleRequest struct {
	Title      string   `json:"title" binding:"required,max=255"`
	Content    string   `json:"content" binding:"required"`
	Summary    string   `json:"summary" binding:"max=500"`
	CoverImage string   `json:"coverImage"`
	CategoryID *int64   `json:"categoryId"`
	Tags       []string `json:"tags"`
	IsPremium  bool     `json:"isPremium"`
	Status     string   `json:"status" binding:"oneof=draft published"`
}

// CreateArticle 创建文章
func (h *ArticleHandler) CreateArticle(c *gin.Context) {
	var req CreateArticleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request")
		return
	}

	userID := c.GetInt64("user_id")

	// 生成slug
	articleSlug := slug.Make(req.Title)
	if articleSlug == "" {
		articleSlug = strconv.FormatInt(time.Now().Unix(), 10)
	}

	// 计算阅读时长（字数/200）
	readingTime := len([]rune(req.Content)) / 200
	if readingTime == 0 {
		readingTime = 1
	}

	now := time.Now().Unix()
	var publishedAt *int64
	if req.Status == "published" {
		publishedAt = &now
	}

	newArticle := &article.Article{
		AuthorID:    userID,
		CategoryID:  req.CategoryID,
		Title:       req.Title,
		Slug:        articleSlug,
		Summary:     req.Summary,
		Content:     req.Content,
		CoverImage:  req.CoverImage,
		Status:      req.Status,
		IsPremium:   req.IsPremium,
		ReadingTime: readingTime,
		PublishedAt: publishedAt,
	}

	if err := h.articleRepo.Create(newArticle); err != nil {
		response.InternalError(c, "Failed to create article")
		return
	}

	c.JSON(http.StatusCreated, response.Response{
		Success: true,
		Data:    newArticle,
	})
}

// ListArticles 文章列表
func (h *ArticleHandler) ListArticles(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	filter := &article.ListFilter{
		Page:   page,
		Limit:  limit,
		Tag:    c.Query("tag"),
		Status: c.DefaultQuery("status", "published"),
		Sort:   c.DefaultQuery("sort", "latest"),
	}

	if categoryID := c.Query("category"); categoryID != "" {
		id, _ := strconv.ParseInt(categoryID, 10, 64)
		filter.CategoryID = &id
	}

	articles, total, err := h.articleRepo.List(filter)
	if err != nil {
		response.InternalError(c, "Failed to get articles")
		return
	}

	response.SuccessWithMeta(c, articles, &response.Meta{
		Total: total,
		Page:  page,
		Limit: limit,
	})
}

// GetArticle 文章详情
func (h *ArticleHandler) GetArticle(c *gin.Context) {
	slug := c.Param("slug")

	article, err := h.articleRepo.FindBySlug(slug)
	if err != nil {
		response.InternalError(c, "Failed to get article")
		return
	}
	if article == nil {
		response.NotFound(c, "Article not found")
		return
	}

	// 异步增加浏览量
	go h.articleRepo.IncrementViewCount(article.ID)

	response.Success(c, article)
}

// UpdateArticle 更新文章
func (h *ArticleHandler) UpdateArticle(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "Invalid article ID")
		return
	}

	var req CreateArticleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request")
		return
	}

	existingArticle, err := h.articleRepo.FindByID(id)
	if err != nil {
		response.InternalError(c, "Failed to get article")
		return
	}
	if existingArticle == nil {
		response.NotFound(c, "Article not found")
		return
	}

	userID := c.GetInt64("user_id")
	userRole := c.GetString("user_role")

	// 权限检查
	if existingArticle.AuthorID != userID && userRole != "admin" {
		response.Forbidden(c, "Access denied")
		return
	}

	existingArticle.Title = req.Title
	existingArticle.Content = req.Content
	existingArticle.Summary = req.Summary
	existingArticle.CoverImage = req.CoverImage
	existingArticle.CategoryID = req.CategoryID
	existingArticle.IsPremium = req.IsPremium
	existingArticle.Status = req.Status

	if err := h.articleRepo.Update(existingArticle); err != nil {
		response.InternalError(c, "Failed to update article")
		return
	}

	response.Success(c, existingArticle)
}

// DeleteArticle 删除文章
func (h *ArticleHandler) DeleteArticle(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "Invalid article ID")
		return
	}

	existingArticle, err := h.articleRepo.FindByID(id)
	if err != nil {
		response.InternalError(c, "Failed to get article")
		return
	}
	if existingArticle == nil {
		response.NotFound(c, "Article not found")
		return
	}

	userID := c.GetInt64("user_id")
	userRole := c.GetString("user_role")

	if existingArticle.AuthorID != userID && userRole != "admin" {
		response.Forbidden(c, "Access denied")
		return
	}

	if err := h.articleRepo.Delete(id); err != nil {
		response.InternalError(c, "Failed to delete article")
		return
	}

	response.Success(c, gin.H{"message": "Article deleted"})
}
