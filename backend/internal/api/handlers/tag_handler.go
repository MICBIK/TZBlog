package handlers

import (
	"strconv"

	"github.com/MICBIK/TZBlog/backend/internal/domain/tag"
	"github.com/MICBIK/TZBlog/backend/internal/api/response"
	"github.com/gin-gonic/gin"
)

// TagHandler handles HTTP requests for tags
type TagHandler struct {
	repo tag.TagRepository
}

// NewTagHandler creates a new tag handler
func NewTagHandler(repo tag.TagRepository) *TagHandler {
	return &TagHandler{
		repo: repo,
	}
}

// List retrieves all tags
// @Summary      获取标签列表
// @Description  获取所有标签（支持分页）
// @Tags         Tags
// @Accept       json
// @Produce      json
// @Param        page query int false "页码" default(1) example(1)
// @Param        limit query int false "每页数量" default(50) example(50)
// @Success      200 {object} response.PaginatedResponse "成功返回标签列表"
// @Failure      500 {object} response.ErrorResponse "服务器错误"
// @Router       /api/v1/tags [get]
func (h *TagHandler) List(c *gin.Context) {
	page := 1
	if p := c.Query("page"); p != "" {
		if parsed, err := strconv.Atoi(p); err == nil && parsed > 0 {
			page = parsed
		}
	}

	limit := 50
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 {
			limit = parsed
		}
	}

	offset := (page - 1) * limit

	tags, total, err := h.repo.List(limit, offset)
	if err != nil {
		response.InternalError(c, "Failed to fetch tags")
		return
	}

	response.Paginated(c, tags, total, page, limit)
}

// Create creates a new tag
// @Summary      创建标签
// @Description  创建新标签（需要管理员权限）
// @Tags         Tags
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        tag body tag.Tag true "标签数据" example({"name":"Go","slug":"go"})
// @Success      201 {object} response.Response{data=tag.Tag} "创建成功"
// @Failure      400 {object} response.ErrorResponse "请求参数错误"
// @Failure      401 {object} response.ErrorResponse "未认证"
// @Failure      403 {object} response.ErrorResponse "无权限"
// @Failure      409 {object} response.ErrorResponse "标签已存在"
// @Failure      500 {object} response.ErrorResponse "服务器错误"
// @Router       /api/v1/tags [post]
func (h *TagHandler) Create(c *gin.Context) {
	var t tag.Tag
	if err := c.ShouldBindJSON(&t); err != nil {
		response.BadRequest(c, "Invalid request data")
		return
	}

	// Validate required fields
	if t.Name == "" || t.Slug == "" {
		response.BadRequest(c, "Name and slug are required")
		return
	}

	if err := h.repo.Create(&t); err != nil {
		response.HandleError(c, err)
		return
	}

	response.Created(c, t)
}

// GetByID retrieves a tag by ID
// @Summary      根据 ID 获取标签
// @Description  通过标签 ID 获取标签详情
// @Tags         Tags
// @Accept       json
// @Produce      json
// @Param        id path int true "标签 ID" example(1)
// @Success      200 {object} response.Response{data=tag.Tag} "成功返回标签"
// @Failure      400 {object} response.ErrorResponse "无效的标签 ID"
// @Failure      404 {object} response.ErrorResponse "标签不存在"
// @Failure      500 {object} response.ErrorResponse "服务器错误"
// @Router       /api/v1/tags/{id} [get]
func (h *TagHandler) GetByID(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "Invalid tag ID")
		return
	}

	t, err := h.repo.FindByID(id)
	if err != nil {
		response.HandleError(c, err)
		return
	}

	if t == nil {
		response.NotFound(c, "Tag not found")
		return
	}

	response.Success(c, t)
}
