package handlers

import (
	"strconv"

	"github.com/MICBIK/TZBlog/backend/internal/domain/comment"
	"github.com/MICBIK/TZBlog/backend/pkg/response"
	"github.com/gin-gonic/gin"
)

type CommentHandler struct {
	commentRepo comment.CommentRepository
}

func NewCommentHandler(commentRepo comment.CommentRepository) *CommentHandler {
	return &CommentHandler{commentRepo: commentRepo}
}

type CreateCommentRequest struct {
	Content  string `json:"content" binding:"required,max=1000"`
	ParentID *int64 `json:"parent_id"`
}

func (h *CommentHandler) CreateComment(c *gin.Context) {
	articleID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "Invalid article ID")
		return
	}

	var req CreateCommentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request")
		return
	}

	userID := c.GetInt64("user_id")

	newComment := &comment.Comment{
		ArticleID: articleID,
		UserID:    userID,
		ParentID:  req.ParentID,
		Content:   req.Content,
	}

	if err := h.commentRepo.Create(newComment); err != nil {
		response.InternalError(c, "Failed to create comment")
		return
	}

	response.Success(c, newComment)
}

func (h *CommentHandler) ListComments(c *gin.Context) {
	articleID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "Invalid article ID")
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset := (page - 1) * limit

	comments, total, err := h.commentRepo.FindByArticleID(articleID, limit, offset)
	if err != nil {
		response.InternalError(c, "Failed to get comments")
		return
	}

	response.SuccessWithMeta(c, comments, &response.Meta{
		Total: total,
		Page:  page,
		Limit: limit,
	})
}

func (h *CommentHandler) DeleteComment(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "Invalid comment ID")
		return
	}

	existingComment, err := h.commentRepo.FindByID(id)
	if err != nil {
		response.InternalError(c, "Failed to get comment")
		return
	}
	if existingComment == nil {
		response.NotFound(c, "Comment not found")
		return
	}

	userID := c.GetInt64("user_id")
	userRole := c.GetString("user_role")

	if existingComment.UserID != userID && userRole != "admin" {
		response.Forbidden(c, "Access denied")
		return
	}

	if err := h.commentRepo.Delete(id); err != nil {
		response.InternalError(c, "Failed to delete comment")
		return
	}

	response.Success(c, gin.H{"message": "Comment deleted"})
}
