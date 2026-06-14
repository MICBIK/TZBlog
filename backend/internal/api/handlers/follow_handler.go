package handlers

import (
	"strconv"

	"github.com/MICBIK/TZBlog/backend/internal/domain/follow"
	"github.com/MICBIK/TZBlog/backend/pkg/response"
	"github.com/gin-gonic/gin"
)

type FollowHandler struct {
	followRepo follow.FollowRepository
}

func NewFollowHandler(followRepo follow.FollowRepository) *FollowHandler {
	return &FollowHandler{
		followRepo: followRepo,
	}
}

// Follow follows a user
// @Summary Follow a user
// @Tags Follow
// @Security Bearer
// @Param id path int true "User ID to follow"
// @Success 200 {object} response.Response
// @Router /users/{id}/follow [post]
func (h *FollowHandler) Follow(c *gin.Context) {
	followerID := c.GetInt64("userID")
	followingID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "Invalid user ID")
		return
	}

	if followerID == followingID {
		response.BadRequest(c, "Cannot follow yourself")
		return
	}

	err = h.followRepo.Follow(followerID, followingID)
	if err != nil {
		response.InternalError(c, "Failed to follow user")
		return
	}

	response.Success(c, gin.H{"message": "Followed successfully"})
}

// Unfollow unfollows a user
// @Summary Unfollow a user
// @Tags Follow
// @Security Bearer
// @Param id path int true "User ID to unfollow"
// @Success 200 {object} response.Response
// @Router /users/{id}/unfollow [post]
func (h *FollowHandler) Unfollow(c *gin.Context) {
	followerID := c.GetInt64("userID")
	followingID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "Invalid user ID")
		return
	}

	err = h.followRepo.Unfollow(followerID, followingID)
	if err != nil {
		response.InternalError(c, "Failed to unfollow user")
		return
	}

	response.Success(c, gin.H{"message": "Unfollowed successfully"})
}

// IsFollowing checks if current user is following another user
// @Summary Check if following
// @Tags Follow
// @Security Bearer
// @Param id path int true "User ID"
// @Success 200 {object} response.Response{data=gin.H{isFollowing=bool}}
// @Router /users/{id}/is-following [get]
func (h *FollowHandler) IsFollowing(c *gin.Context) {
	followerID := c.GetInt64("userID")
	followingID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "Invalid user ID")
		return
	}

	isFollowing, err := h.followRepo.IsFollowing(followerID, followingID)
	if err != nil {
		response.InternalError(c, "Failed to check follow status")
		return
	}

	response.Success(c, gin.H{"isFollowing": isFollowing})
}

// GetFollowers returns followers of a user
// @Summary Get user followers
// @Tags Follow
// @Param id path int true "User ID"
// @Param limit query int false "Limit" default(20)
// @Param offset query int false "Offset" default(0)
// @Success 200 {object} response.Response
// @Router /users/{id}/followers [get]
func (h *FollowHandler) GetFollowers(c *gin.Context) {
	userID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "Invalid user ID")
		return
	}

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	followers, total, err := h.followRepo.GetFollowers(userID, limit, offset)
	if err != nil {
		response.InternalError(c, "Failed to get followers")
		return
	}

	response.Success(c, gin.H{
		"followers": followers,
		"total":     total,
		"limit":     limit,
		"offset":    offset,
	})
}

// GetFollowing returns users that a user is following
// @Summary Get user following
// @Tags Follow
// @Param id path int true "User ID"
// @Param limit query int false "Limit" default(20)
// @Param offset query int false "Offset" default(0)
// @Success 200 {object} response.Response
// @Router /users/{id}/following [get]
func (h *FollowHandler) GetFollowing(c *gin.Context) {
	userID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "Invalid user ID")
		return
	}

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	following, total, err := h.followRepo.GetFollowing(userID, limit, offset)
	if err != nil {
		response.InternalError(c, "Failed to get following")
		return
	}

	response.Success(c, gin.H{
		"following": following,
		"total":     total,
		"limit":     limit,
		"offset":    offset,
	})
}
