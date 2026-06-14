package handlers

import (
	"strconv"

	"github.com/MICBIK/TZBlog/backend/internal/domain/category"
	"github.com/MICBIK/TZBlog/backend/pkg/response"
	"github.com/gin-gonic/gin"
)

// CategoryHandler handles HTTP requests for categories
type CategoryHandler struct {
	repo category.CategoryRepository
}

// NewCategoryHandler creates a new category handler
func NewCategoryHandler(repo category.CategoryRepository) *CategoryHandler {
	return &CategoryHandler{
		repo: repo,
	}
}

// List retrieves all categories
// @Summary      获取分类列表
// @Description  获取所有分类（支持分页）
// @Tags         Categories
// @Accept       json
// @Produce      json
// @Param        page query int false "页码" default(1) example(1)
// @Param        limit query int false "每页数量" default(20) example(20)
// @Success      200 {object} response.Response{data=[]category.Category,metadata=response.Metadata} "成功返回分类列表"
// @Failure      500 {object} response.ErrorResponse "服务器错误"
// @Router       /categories [get]
func (h *CategoryHandler) List(c *gin.Context) {
	page := 1
	if p := c.Query("page"); p != "" {
		if parsed, err := strconv.Atoi(p); err == nil && parsed > 0 {
			page = parsed
		}
	}

	limit := 20
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 {
			limit = parsed
		}
	}

	offset := (page - 1) * limit

	categories, total, err := h.repo.List(limit, offset)
	if err != nil {
		response.InternalError(c, "Failed to fetch categories")
		return
	}

	response.Paginated(c, categories, total, page, limit)
}

// Create creates a new category
// @Summary      创建分类
// @Description  创建新分类（需要管理员权限）
// @Tags         Categories
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        category body category.Category true "分类数据" example({"name":"技术","slug":"tech","description":"技术相关文章"})
// @Success      201 {object} response.Response{data=category.Category} "创建成功"
// @Failure      400 {object} response.ErrorResponse "请求参数错误"
// @Failure      401 {object} response.ErrorResponse "未认证"
// @Failure      403 {object} response.ErrorResponse "无权限"
// @Failure      409 {object} response.ErrorResponse "分类已存在"
// @Failure      500 {object} response.ErrorResponse "服务器错误"
// @Router       /categories [post]
func (h *CategoryHandler) Create(c *gin.Context) {
	var cat category.Category
	if err := c.ShouldBindJSON(&cat); err != nil {
		response.BadRequest(c, "Invalid request data")
		return
	}

	// Validate required fields
	if cat.Name == "" || cat.Slug == "" {
		response.BadRequest(c, "Name and slug are required")
		return
	}

	if err := h.repo.Create(&cat); err != nil {
		response.HandleError(c, err)
		return
	}

	response.Created(c, cat)
}

// GetByID retrieves a category by ID
// @Summary      根据 ID 获取分类
// @Description  通过分类 ID 获取分类详情
// @Tags         Categories
// @Accept       json
// @Produce      json
// @Param        id path int true "分类 ID" example(1)
// @Success      200 {object} response.Response{data=category.Category} "成功返回分类"
// @Failure      400 {object} response.ErrorResponse "无效的分类 ID"
// @Failure      404 {object} response.ErrorResponse "分类不存在"
// @Failure      500 {object} response.ErrorResponse "服务器错误"
// @Router       /categories/{id} [get]
func (h *CategoryHandler) GetByID(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "Invalid category ID")
		return
	}

	cat, err := h.repo.FindByID(id)
	if err != nil {
		response.HandleError(c, err)
		return
	}

	if cat == nil {
		response.NotFound(c, "Category not found")
		return
	}

	response.Success(c, cat)
}
