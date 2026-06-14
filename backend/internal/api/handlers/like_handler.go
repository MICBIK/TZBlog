package handlers

import (
	"strconv"

	"github.com/MICBIK/TZBlog/backend/internal/api/response"
	"github.com/MICBIK/TZBlog/backend/internal/domain/like"
	"github.com/gin-gonic/gin"
)

// LikeHandler handles like-related HTTP requests
type LikeHandler struct {
	likeRepo like.LikeRepository
}

// NewLikeHandler creates a new like handler
func NewLikeHandler(likeRepo like.LikeRepository) *LikeHandler {
	return &LikeHandler{
		likeRepo: likeRepo,
	}
}

// LikeArticle likes an article
// @Summary      Like an article
// @Description  Like an article by ID
// @Tags         Likes
// @Accept       json
// @Produce      json
// @Security     Bearer
// @Param        id path int true "Article ID"
// @Success      200 {object} response.Response "Successfully liked"
// @Failure      400 {object} response.ErrorResponse "Invalid article ID"
// @Failure      401 {object} response.ErrorResponse "Unauthorized"
// @Failure      500 {object} response.ErrorResponse "Internal server error"
// @Router       /api/v1/likes/articles/{id} [post]
func (h *LikeHandler) LikeArticle(c *gin.Context) {
	userID := c.GetInt64("userID")
	articleID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "Invalid article ID")
		return
	}

	// Check if already liked
	exists, err := h.likeRepo.IsLiked(articleID, userID)
	if err != nil {
		response.InternalError(c, "Failed to check like status")
		return
	}

	if exists {
		response.BadRequest(c, "Already liked this article")
		return
	}

	// Create like
	newLike := &like.Like{
		ArticleID: articleID,
		UserID:    userID,
	}
	err = h.likeRepo.Create(newLike)
	if err != nil {
		response.InternalError(c, "Failed to like article")
		return
	}

	// Get updated like count
	count, err := h.likeRepo.CountByArticle(articleID)
	if err != nil {
		count = 0 // Fallback
	}

	response.Success(c, gin.H{
		"message": "Article liked successfully",
		"liked":   true,
		"count":   count,
	})
}

// UnlikeArticle unlikes an article
// @Summary      Unlike an article
// @Description  Remove like from an article by ID
// @Tags         Likes
// @Accept       json
// @Produce      json
// @Security     Bearer
// @Param        id path int true "Article ID"
// @Success      200 {object} response.Response "Successfully unliked"
// @Failure      400 {object} response.ErrorResponse "Invalid article ID"
// @Failure      401 {object} response.ErrorResponse "Unauthorized"
// @Failure      500 {object} response.ErrorResponse "Internal server error"
// @Router       /api/v1/likes/articles/{id} [delete]
func (h *LikeHandler) UnlikeArticle(c *gin.Context) {
	userID := c.GetInt64("userID")
	articleID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "Invalid article ID")
		return
	}

	// Unlike
	err = h.likeRepo.Delete(articleID, userID)
	if err != nil {
		response.InternalError(c, "Failed to unlike article")
		return
	}

	// Get updated like count
	count, err := h.likeRepo.CountByArticle(articleID)
	if err != nil {
		count = 0 // Fallback
	}

	response.Success(c, gin.H{
		"message": "Article unliked successfully",
		"liked":   false,
		"count":   count,
	})
}

// GetLikeStatus gets the like status for an article
// @Summary      Get like status
// @Description  Get like status and count for an article
// @Tags         Likes
// @Accept       json
// @Produce      json
// @Security     Bearer
// @Param        id path int true "Article ID"
// @Success      200 {object} response.Response{data=object{liked=bool,count=int}} "Like status"
// @Failure      400 {object} response.ErrorResponse "Invalid article ID"
// @Failure      401 {object} response.ErrorResponse "Unauthorized"
// @Failure      500 {object} response.ErrorResponse "Internal server error"
// @Router       /api/v1/likes/articles/{id}/status [get]
func (h *LikeHandler) GetLikeStatus(c *gin.Context) {
	userID := c.GetInt64("userID")
	articleID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "Invalid article ID")
		return
	}

	// Check if liked
	liked, err := h.likeRepo.IsLiked(articleID, userID)
	if err != nil {
		response.InternalError(c, "Failed to check like status")
		return
	}

	// Get like count
	count, err := h.likeRepo.CountByArticle(articleID)
	if err != nil {
		count = 0 // Fallback
	}

	response.Success(c, gin.H{
		"liked": liked,
		"count": count,
	})
}
