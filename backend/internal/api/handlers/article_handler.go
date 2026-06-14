package handlers

import (
	"strconv"

	"github.com/MICBIK/TZBlog/backend/internal/domain/article"
	"github.com/MICBIK/TZBlog/backend/internal/service"
	"github.com/MICBIK/TZBlog/backend/pkg/response"
	"github.com/gin-gonic/gin"
)

// ArticleHandler handles HTTP requests for articles
type ArticleHandler struct {
	service *service.ArticleService
}

// NewArticleHandler creates a new article handler
func NewArticleHandler(repo article.Repository) *ArticleHandler {
	return &ArticleHandler{
		service: service.NewArticleService(repo),
	}
}

// CreateArticle creates a new article
// @Summary Create a new article
// @Tags Articles
// @Accept json
// @Produce json
// @Param article body service.CreateArticleDTO true "Article data"
// @Success 201 {object} article.Article
// @Router /articles [post]
func (h *ArticleHandler) CreateArticle(c *gin.Context) {
	var req service.CreateArticleDTO
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request data")
		return
	}

	userID := c.GetInt64("user_id")
	if userID == 0 {
		response.Unauthorized(c, "Authentication required")
		return
	}

	art, err := h.service.CreateArticle(userID, &req)
	if err != nil {
		response.HandleError(c, err)
		return
	}

	response.Created(c, art)
}

// GetArticleByID retrieves an article by ID
// @Summary Get article by ID
// @Tags Articles
// @Produce json
// @Param id path int true "Article ID"
// @Success 200 {object} article.Article
// @Router /articles/{id} [get]
func (h *ArticleHandler) GetArticleByID(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "Invalid article ID")
		return
	}

	art, err := h.service.GetArticleByID(id)
	if err != nil {
		response.HandleError(c, err)
		return
	}

	response.Success(c, art)
}

// GetArticleBySlug retrieves an article by slug
// @Summary Get article by slug
// @Tags Articles
// @Produce json
// @Param slug path string true "Article slug"
// @Success 200 {object} article.Article
// @Router /articles/slug/{slug} [get]
func (h *ArticleHandler) GetArticleBySlug(c *gin.Context) {
	slug := c.Param("slug")
	if slug == "" {
		response.BadRequest(c, "Article slug is required")
		return
	}

	art, err := h.service.GetArticleBySlug(slug)
	if err != nil {
		response.HandleError(c, err)
		return
	}

	response.Success(c, art)
}

// ListArticles retrieves a list of articles
// @Summary List articles
// @Tags Articles
// @Produce json
// @Param status query string false "Filter by status"
// @Param author_id query int false "Filter by author ID"
// @Param category_id query int false "Filter by category ID"
// @Param tag_id query int false "Filter by tag ID"
// @Param search query string false "Search query"
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(10)
// @Success 200 {object} response.PaginatedResponse
// @Router /articles [get]
func (h *ArticleHandler) ListArticles(c *gin.Context) {
	var filter article.ListFilter

	filter.Status = c.Query("status")
	filter.Search = c.Query("search")

	if authorID := c.Query("author_id"); authorID != "" {
		if id, err := strconv.ParseInt(authorID, 10, 64); err == nil {
			filter.AuthorID = id
		}
	}
	if categoryID := c.Query("category_id"); categoryID != "" {
		if id, err := strconv.ParseInt(categoryID, 10, 64); err == nil {
			filter.CategoryID = id
		}
	}
	if tagID := c.Query("tag_id"); tagID != "" {
		if id, err := strconv.ParseInt(tagID, 10, 64); err == nil {
			filter.TagID = id
		}
	}

	page := 1
	if p := c.Query("page"); p != "" {
		if parsed, err := strconv.Atoi(p); err == nil && parsed > 0 {
			page = parsed
		}
	}

	limit := 10
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 {
			limit = parsed
		}
	}

	filter.Page = page
	filter.Limit = limit

	articles, total, err := h.service.ListArticles(&filter)
	if err != nil {
		response.InternalError(c, "Failed to fetch articles")
		return
	}

	response.Paginated(c, articles, total, page, limit)
}

// UpdateArticle updates an existing article
// @Summary Update an article
// @Tags Articles
// @Accept json
// @Produce json
// @Param id path int true "Article ID"
// @Param article body service.UpdateArticleDTO true "Updated article data"
// @Success 200 {object} article.Article
// @Router /articles/{id} [put]
func (h *ArticleHandler) UpdateArticle(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "Invalid article ID")
		return
	}

	var req service.UpdateArticleDTO
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request data")
		return
	}

	userID := c.GetInt64("user_id")
	if userID == 0 {
		response.Unauthorized(c, "Authentication required")
		return
	}

	art, err := h.service.UpdateArticle(id, userID, &req)
	if err != nil {
		response.HandleError(c, err)
		return
	}

	response.Success(c, art)
}

// DeleteArticle deletes an article
// @Summary Delete an article
// @Tags Articles
// @Param id path int true "Article ID"
// @Success 200 {object} response.SuccessResponse
// @Router /articles/{id} [delete]
func (h *ArticleHandler) DeleteArticle(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "Invalid article ID")
		return
	}

	userID := c.GetInt64("user_id")
	if userID == 0 {
		response.Unauthorized(c, "Authentication required")
		return
	}

	if err := h.service.DeleteArticle(id, userID); err != nil {
		response.HandleError(c, err)
		return
	}

	response.Success(c, gin.H{"message": "Article deleted successfully"})
}
