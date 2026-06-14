package handlers

import (
	"strconv"

	"github.com/MICBIK/TZBlog/backend/internal/domain/like"
	"github.com/MICBIK/TZBlog/backend/pkg/response"
	"github.com/gin-gonic/gin"
)

type LikeHandler struct {
	likeRepo like.LikeRepository
}

func NewLikeHandler(likeRepo like.LikeRepository) *LikeHandler {
	return &LikeHandler{likeRepo: likeRepo}
}

func (h *LikeHandler) ToggleArticleLike(c *gin.Context) {
	articleID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "Invalid article ID")
		return
	}

	userID := c.GetInt64("user_id")

	hasLiked, err := h.likeRepo.HasLiked(userID, articleID, "article")
	if err != nil {
		response.InternalError(c, "Failed to check like status")
		return
	}

	if hasLiked {
		if err := h.likeRepo.Delete(userID, articleID, "article"); err != nil {
			response.InternalError(c, "Failed to unlike")
			return
		}
	} else {
		newLike := &like.Like{
			UserID:     userID,
			TargetID:   articleID,
			TargetType: "article",
		}
		if err := h.likeRepo.Create(newLike); err != nil {
			response.InternalError(c, "Failed to like")
			return
		}
	}

	count, _ := h.likeRepo.GetLikeCount(articleID, "article")

	response.Success(c, gin.H{
		"liked": !hasLiked,
		"count": count,
	})
}

func (h *LikeHandler) ToggleCommentLike(c *gin.Context) {
	commentID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "Invalid comment ID")
		return
	}

	userID := c.GetInt64("user_id")

	hasLiked, err := h.likeRepo.HasLiked(userID, commentID, "comment")
	if err != nil {
		response.InternalError(c, "Failed to check like status")
		return
	}

	if hasLiked {
		if err := h.likeRepo.Delete(userID, commentID, "comment"); err != nil {
			response.InternalError(c, "Failed to unlike")
			return
		}
	} else {
		newLike := &like.Like{
			UserID:     userID,
			TargetID:   commentID,
			TargetType: "comment",
		}
		if err := h.likeRepo.Create(newLike); err != nil {
			response.InternalError(c, "Failed to like")
			return
		}
	}

	count, _ := h.likeRepo.GetLikeCount(commentID, "comment")

	response.Success(c, gin.H{
		"liked": !hasLiked,
		"count": count,
	})
}
