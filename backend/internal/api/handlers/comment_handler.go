package handlers

import (
	"strconv"

	"github.com/MICBIK/TZBlog/backend/internal/domain/comment"
	"github.com/MICBIK/TZBlog/backend/internal/api/response"
	"github.com/gin-gonic/gin"
)

// CommentHandler handles HTTP requests for comments
type CommentHandler struct {
	service comment.Service
}

// NewCommentHandler creates a new comment handler
func NewCommentHandler(service comment.Service) *CommentHandler {
	return &CommentHandler{
		service: service,
	}
}

// CreateComment creates a new comment
// @Summary      创建评论
// @Description  为文章创建新评论（需要登录）
// @Tags         Comments
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        comment body comment.CreateCommentDTO true "评论数据" example({"article_id":1,"content":"很棒的文章！","parent_id":0})
// @Success      201 {object} response.Response{data=comment.Comment} "创建成功"
// @Failure      400 {object} response.ErrorResponse "请求参数错误"
// @Failure      401 {object} response.ErrorResponse "未认证"
// @Failure      404 {object} response.ErrorResponse "文章不存在"
// @Failure      500 {object} response.ErrorResponse "服务器错误"
// @Router       /api/v1/comments [post]
func (h *CommentHandler) CreateComment(c *gin.Context) {
	var req comment.CreateCommentDTO
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
// @Summary      根据 ID 获取评论
// @Description  通过评论 ID 获取评论详情
// @Tags         Comments
// @Produce      json
// @Param        id path int true "评论 ID" example(1)
// @Success      200 {object} response.Response{data=comment.Comment} "成功返回评论" example({"success":true,"data":{"id":1,"article_id":1,"user_id":1,"content":"很棒的文章！","created_at":"2024-01-01T00:00:00Z"}})
// @Failure      400 {object} response.ErrorResponse "无效的评论 ID"
// @Failure      404 {object} response.ErrorResponse "评论不存在"
// @Failure      500 {object} response.ErrorResponse "服务器错误"
// @Router       /api/v1/comments/{id} [get]
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
// @Summary      获取评论列表
// @Description  分页获取评论列表，支持多种筛选条件
// @Tags         Comments
// @Produce      json
// @Param        article_id query int false "文章 ID" example(1)
// @Param        user_id query int false "用户 ID" example(1)
// @Param        parent_id query int false "父评论 ID" example(0)
// @Param        page query int false "页码" default(1) example(1)
// @Param        limit query int false "每页数量" default(20) example(20)
// @Success      200 {object} response.PaginatedResponse "成功返回评论列表"
// @Failure      500 {object} response.ErrorResponse "服务器错误"
// @Router       /api/v1/comments [get]
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
// @Summary      更新评论
// @Description  更新已有评论（需要是评论作者本人）
// @Tags         Comments
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id path int true "评论 ID" example(1)
// @Param        comment body comment.UpdateCommentDTO true "更新的评论数据" example({"content":"更新后的评论内容"})
// @Success      200 {object} response.Response{data=comment.Comment} "更新成功"
// @Failure      400 {object} response.ErrorResponse "请求参数错误"
// @Failure      401 {object} response.ErrorResponse "未认证"
// @Failure      403 {object} response.ErrorResponse "无权限修改此评论"
// @Failure      404 {object} response.ErrorResponse "评论不存在"
// @Failure      500 {object} response.ErrorResponse "服务器错误"
// @Router       /api/v1/comments/{id} [put]
func (h *CommentHandler) UpdateComment(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "Invalid comment ID")
		return
	}

	var req comment.UpdateCommentDTO
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
// @Summary      删除评论
// @Description  删除评论（需要是评论作者本人或管理员）
// @Tags         Comments
// @Security     BearerAuth
// @Param        id path int true "评论 ID" example(1)
// @Success      200 {object} response.SuccessResponse "删除成功" example({"success":true,"data":{"message":"Comment deleted successfully"}})
// @Failure      400 {object} response.ErrorResponse "无效的评论 ID"
// @Failure      401 {object} response.ErrorResponse "未认证"
// @Failure      403 {object} response.ErrorResponse "无权限删除此评论"
// @Failure      404 {object} response.ErrorResponse "评论不存在"
// @Failure      500 {object} response.ErrorResponse "服务器错误"
// @Router       /api/v1/comments/{id} [delete]
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

// ListArticleComments retrieves comments for a specific article
// @Summary      List article comments
// @Description  Get all comments for a specific article with pagination
// @Tags         Comments
// @Produce      json
// @Param        id path int true "Article ID"
// @Param        page query int false "Page number" default(1)
// @Param        limit query int false "Items per page" default(20)
// @Success      200 {object} response.Response{data=[]comment.Comment,metadata=response.Metadata}
// @Failure      400 {object} response.ErrorResponse "Invalid article ID"
// @Failure      500 {object} response.ErrorResponse "Server error"
// @Router       /api/v1/articles/{id}/comments [get]
func (h *CommentHandler) ListArticleComments(c *gin.Context) {
	articleID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "Invalid article ID")
		return
	}

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

	filter := comment.ListFilter{
		ArticleID: articleID,
		Limit:     limit,
		Offset:    (page - 1) * limit,
	}

	comments, total, err := h.service.ListComments(&filter)
	if err != nil {
		response.InternalError(c, "Failed to fetch article comments")
		return
	}

	response.Paginated(c, comments, total, page, limit)
}
