package handlers

import (
	"fmt"
	"strconv"

	"github.com/MICBIK/TZBlog/backend/internal/domain/article"
	"github.com/MICBIK/TZBlog/backend/internal/api/response"
	"github.com/gin-gonic/gin"
)

// ArticleHandler handles HTTP requests for articles
type ArticleHandler struct {
	service article.Service
}

// NewArticleHandler creates a new article handler
func NewArticleHandler(service article.Service) *ArticleHandler {
	return &ArticleHandler{
		service: service,
	}
}

// CreateArticle creates a new article
// @Summary      创建文章
// @Description  创建新文章（需要登录）
// @Tags         Articles
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        article body article.CreateArticleDTO true "文章数据" example({"title":"文章标题","content":"文章内容","status":"draft"})
// @Success      201 {object} response.Response{data=article.Article} "创建成功"
// @Failure      400 {object} response.ErrorResponse "请求参数错误"
// @Failure      401 {object} response.ErrorResponse "未认证"
// @Failure      409 {object} response.ErrorResponse "文章 slug 已存在"
// @Failure      500 {object} response.ErrorResponse "服务器错误"
// @Router       /api/v1/articles [post]
func (h *ArticleHandler) CreateArticle(c *gin.Context) {
	var req article.CreateArticleDTO
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
// @Summary      根据 ID 获取文章
// @Description  通过文章 ID 获取文章详情
// @Tags         Articles
// @Accept       json
// @Produce      json
// @Param        id path int true "文章 ID" example(1)
// @Success      200 {object} response.Response{data=article.Article} "成功返回文章"
// @Failure      400 {object} response.ErrorResponse "无效的文章 ID"
// @Failure      404 {object} response.ErrorResponse "文章不存在"
// @Failure      500 {object} response.ErrorResponse "服务器错误"
// @Router       /api/v1/articles/{id} [get]
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
// @Summary      根据 slug 获取文章
// @Description  通过文章 slug 获取文章详情
// @Tags         Articles
// @Accept       json
// @Produce      json
// @Param        slug path string true "文章 slug" example("my-first-post")
// @Success      200 {object} response.Response{data=article.Article} "成功返回文章"
// @Failure      400 {object} response.ErrorResponse "文章 slug 为空"
// @Failure      404 {object} response.ErrorResponse "文章不存在"
// @Failure      500 {object} response.ErrorResponse "服务器错误"
// @Router       /api/v1/articles/slug/{slug} [get]
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
// @Summary      获取文章列表
// @Description  分页获取文章列表，支持多种筛选条件
// @Tags         Articles
// @Accept       json
// @Produce      json
// @Param        status query string false "文章状态" Enums(draft, published, archived) example(published)
// @Param        author_id query int false "作者 ID" example(1)
// @Param        category_id query int false "分类 ID" example(1)
// @Param        tag_id query int false "标签 ID" example(1)
// @Param        search query string false "搜索关键词" example("golang")
// @Param        page query int false "页码" default(1) example(1)
// @Param        limit query int false "每页数量" default(10) example(20)
// @Success      200 {object} response.PaginatedResponse "成功返回文章列表"
// @Failure      500 {object} response.ErrorResponse "服务器错误"
// @Router       /api/v1/articles [get]
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
// @Summary      更新文章
// @Description  更新已有文章（需要是作者本人）
// @Tags         Articles
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        slug path string true "文章 slug" example("my-first-post")
// @Param        article body article.UpdateArticleDTO true "更新的文章数据" example({"title":"新标题","content":"新内容"})
// @Success      200 {object} response.Response{data=article.Article} "更新成功"
// @Failure      400 {object} response.ErrorResponse "请求参数错误"
// @Failure      401 {object} response.ErrorResponse "未认证"
// @Failure      403 {object} response.ErrorResponse "无权限修改此文章"
// @Failure      404 {object} response.ErrorResponse "文章不存在"
// @Failure      500 {object} response.ErrorResponse "服务器错误"
// @Router       /api/v1/articles/{slug} [put]
func (h *ArticleHandler) UpdateArticle(c *gin.Context) {
	slug := c.Param("slug")
	if slug == "" {
		response.BadRequest(c, "Article slug is required")
		return
	}

	// First get the article by slug to obtain its ID
	existingArticle, err := h.service.GetArticleBySlug(slug)
	if err != nil {
		response.HandleError(c, err)
		return
	}

	var req article.UpdateArticleDTO
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request data")
		return
	}

	userID := c.GetInt64("user_id")
	if userID == 0 {
		response.Unauthorized(c, "Authentication required")
		return
	}

	art, err := h.service.UpdateArticle(existingArticle.ID, userID, &req)
	if err != nil {
		response.HandleError(c, err)
		return
	}

	response.Success(c, art)
}

// DeleteArticle deletes an article
// @Summary      删除文章
// @Description  删除文章（需要是作者本人或管理员）
// @Tags         Articles
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        slug path string true "文章 slug" example("my-first-post")
// @Success      200 {object} response.SuccessResponse "删除成功"
// @Failure      400 {object} response.ErrorResponse "无效的文章 slug"
// @Failure      401 {object} response.ErrorResponse "未认证"
// @Failure      403 {object} response.ErrorResponse "无权限删除此文章"
// @Failure      404 {object} response.ErrorResponse "文章不存在"
// @Failure      500 {object} response.ErrorResponse "服务器错误"
// @Router       /api/v1/articles/{slug} [delete]
func (h *ArticleHandler) DeleteArticle(c *gin.Context) {
	slug := c.Param("slug")
	if slug == "" {
		response.BadRequest(c, "Article slug is required")
		return
	}

	// First get the article by slug to obtain its ID
	existingArticle, err := h.service.GetArticleBySlug(slug)
	if err != nil {
		response.HandleError(c, err)
		return
	}

	userID := c.GetInt64("user_id")
	if userID == 0 {
		response.Unauthorized(c, "Authentication required")
		return
	}

	if err := h.service.DeleteArticle(existingArticle.ID, userID); err != nil {
		response.HandleError(c, err)
		return
	}

	response.Success(c, gin.H{"message": "Article deleted successfully"})
}

// PatchArticle partially updates an article
// @Summary      部分更新文章
// @Description  部分更新文章字段（需要是作者本人），只更新提供的字段
// @Tags         Articles
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        slug path string true "文章 slug" example("my-first-post")
// @Param        updates body map[string]interface{} true "需要更新的字段" example({"title":"新标题","status":"published"})
// @Success      200 {object} response.Response{data=article.Article} "更新成功" example({"success":true,"data":{"id":1,"title":"新标题","status":"published"}})
// @Failure      400 {object} response.ErrorResponse "请求参数错误"
// @Failure      401 {object} response.ErrorResponse "未认证"
// @Failure      403 {object} response.ErrorResponse "无权限修改此文章"
// @Failure      404 {object} response.ErrorResponse "文章不存在"
// @Failure      500 {object} response.ErrorResponse "服务器错误"
// @Router       /api/v1/articles/{slug} [patch]
func (h *ArticleHandler) PatchArticle(c *gin.Context) {
	slug := c.Param("slug")
	if slug == "" {
		response.BadRequest(c, "Article slug is required")
		return
	}

	var updates map[string]interface{}
	if err := c.ShouldBindJSON(&updates); err != nil {
		response.BadRequest(c, "Invalid request data")
		return
	}

	userID := c.GetInt64("user_id")
	if userID == 0 {
		response.Unauthorized(c, "Authentication required")
		return
	}

	art, err := h.service.PatchArticle(slug, userID, updates)
	if err != nil {
		response.HandleError(c, err)
		return
	}

	response.Success(c, art)
}

// BatchDelete deletes multiple articles
// @Summary      批量删除文章
// @Description  批量删除多篇文章（需要是作者本人），最多100篇
// @Tags         Articles
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        request body object{ids=[]int64} true "文章ID列表" example({"ids":[1,2,3]})
// @Success      200 {object} response.Response{data=object{deleted=int}} "删除成功" example({"success":true,"data":{"deleted":3,"message":"Successfully deleted 3 articles"}})
// @Failure      400 {object} response.ErrorResponse "请求参数错误"
// @Failure      401 {object} response.ErrorResponse "未认证"
// @Failure      500 {object} response.ErrorResponse "服务器错误"
// @Router       /api/v1/articles/batch [delete]
func (h *ArticleHandler) BatchDelete(c *gin.Context) {
	var req struct {
		IDs []int64 `json:"ids" binding:"required,min=1,max=100"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request data: ids required (1-100 items)")
		return
	}

	userID := c.GetInt64("user_id")
	if userID == 0 {
		response.Unauthorized(c, "Authentication required")
		return
	}

	count, err := h.service.BatchDelete(req.IDs, userID)
	if err != nil {
		response.HandleError(c, err)
		return
	}

	response.Success(c, gin.H{
		"deleted": count,
		"message": fmt.Sprintf("Successfully deleted %d articles", count),
	})
}

// BatchUpdateStatus updates status for multiple articles
// @Summary      批量更新文章状态
// @Description  批量更新多篇文章的状态（需要是作者本人），最多100篇
// @Tags         Articles
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        request body object{ids=[]int64,status=string} true "文章ID列表和目标状态" example({"ids":[1,2,3],"status":"published"})
// @Success      200 {object} response.Response{data=object{updated=int}} "更新成功" example({"success":true,"data":{"updated":3,"message":"Successfully updated 3 articles to published"}})
// @Failure      400 {object} response.ErrorResponse "请求参数错误"
// @Failure      401 {object} response.ErrorResponse "未认证"
// @Failure      500 {object} response.ErrorResponse "服务器错误"
// @Router       /api/v1/articles/batch/status [put]
func (h *ArticleHandler) BatchUpdateStatus(c *gin.Context) {
	var req struct {
		IDs    []int64 `json:"ids" binding:"required,min=1,max=100"`
		Status string  `json:"status" binding:"required,oneof=draft published archived"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request data: ids (1-100 items) and status (draft/published/archived) required")
		return
	}

	userID := c.GetInt64("user_id")
	if userID == 0 {
		response.Unauthorized(c, "Authentication required")
		return
	}

	count, err := h.service.BatchUpdateStatus(req.IDs, userID, req.Status)
	if err != nil {
		response.HandleError(c, err)
		return
	}

	response.Success(c, gin.H{
		"updated": count,
		"message": fmt.Sprintf("Successfully updated %d articles to %s", count, req.Status),
	})
}
