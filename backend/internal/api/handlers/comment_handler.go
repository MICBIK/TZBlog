package handlers

import (
	"strconv"

	"github.com/MICBIK/TZBlog/backend/internal/domain/comment"
	"github.com/MICBIK/TZBlog/backend/internal/service"
	"github.com/MICBIK/TZBlog/backend/pkg/response"
	"github.com/gin-gonic/gin"
)

// CommentHandler handles HTTP requests for comments
type CommentHandler struct {
	service *service.CommentService
}

// NewCommentHandler creates a new comment handler
func NewCommentHandler(repo comment.Repository) *CommentHandler {
	return &CommentHandler{
		service: service.NewCommentService(repo),
	}
}

// CreateComment creates a new comment
// @Summary      创建评论
// @Description  为文章创建新评论（需要登录）
// @Tags         Comments
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        comment body service.CreateCommentDTO true "评论数据" example({"article_id":1,"content":"很棒的文章！","parent_id":0})
// @Success      201 {object} response.Response{data=comment.Comment} "创建成功"
// @Failure      400 {object} response.ErrorResponse "请求参数错误"
// @Failure      401 {object} response.ErrorResponse "未认证"
// @Failure      404 {object} response.ErrorResponse "文章不存在"
// @Failure      500 {object} response.ErrorResponse "服务器错误"
// @Router       /comments [post]
func (h *CommentHandler) CreateComment(c *gin.Context) {
	var req service.CreateCommentDTO
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request data")
		return
	}

	userID := c.GetInt64("user_id")
	if userID == 0 {
		response.Unauthorized(c, "Authentication required")
		return
	}

	comm, err := h.service.CreateComment(userID, &req)
	if err != nil {
		response.HandleError(c, err)
		return
	}

	response.Created(c, comm)
}

// GetComment retrieves a comment by ID
// @Summary Get comment by ID
// @Tags Comments
// @Produce json
// @Param id path int true "Comment ID"
// @Success 200 {object} comment.Comment
// @Router /comments/{id} [get]
func (h *CommentHandler) GetComment(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "Invalid comment ID")
		return
	}

	comm, err := h.service.GetCommentByID(id)
	if err != nil {
		response.HandleError(c, err)
		return
	}

	response.Success(c, comm)
}

// ListComments retrieves a list of comments
// @Summary List comments
// @Tags Comments
// @Produce json
// @Param article_id query int false "Filter by article ID"
// @Param user_id query int false "Filter by user ID"
// @Param parent_id query int false "Filter by parent comment ID"
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(20)
// @Success 200 {object} response.PaginatedResponse
// @Router /comments [get]
func (h *CommentHandler) ListComments(c *gin.Context) {
	var filter comment.ListFilter

	if articleID := c.Query("article_id"); articleID != "" {
		if id, err := strconv.ParseInt(articleID, 10, 64); err == nil {
			filter.ArticleID = id
		}
	}
	if userID := c.Query("user_id"); userID != "" {
		if id, err := strconv.ParseInt(userID, 10, 64); err == nil {
			filter.UserID = id
		}
	}
	// Note: ParentID filtering not supported in current ListFilter
	// if parentID := c.Query("parent_id"); parentID != "" {
	// 	if id, err := strconv.ParseInt(parentID, 10, 64); err == nil {
	// 		filter.ParentID = &id
	// 	}
	// }

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

	filter.Limit = limit
	filter.Offset = (page - 1) * limit

	comments, total, err := h.service.ListComments(&filter)
	if err != nil {
		response.InternalError(c, "Failed to fetch comments")
		return
	}

	response.Paginated(c, comments, total, page, limit)
}

// UpdateComment updates an existing comment
// @Summary Update a comment
// @Tags Comments
// @Accept json
// @Produce json
// @Param id path int true "Comment ID"
// @Param comment body service.UpdateCommentDTO true "Updated comment data"
// @Success 200 {object} comment.Comment
// @Router /comments/{id} [put]
func (h *CommentHandler) UpdateComment(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "Invalid comment ID")
		return
	}

	var req service.UpdateCommentDTO
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request data")
		return
	}

	userID := c.GetInt64("user_id")
	if userID == 0 {
		response.Unauthorized(c, "Authentication required")
		return
	}

	comm, err := h.service.UpdateComment(id, userID, &req)
	if err != nil {
		response.HandleError(c, err)
		return
	}

	response.Success(c, comm)
}

// DeleteComment deletes a comment
// @Summary Delete a comment
// @Tags Comments
// @Param id path int true "Comment ID"
// @Success 200 {object} response.SuccessResponse
// @Router /comments/{id} [delete]
func (h *CommentHandler) DeleteComment(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "Invalid comment ID")
		return
	}

	userID := c.GetInt64("user_id")
	if userID == 0 {
		response.Unauthorized(c, "Authentication required")
		return
	}

	if err := h.service.DeleteComment(id, userID); err != nil {
		response.HandleError(c, err)
		return
	}

	response.Success(c, gin.H{"message": "Comment deleted successfully"})
}
