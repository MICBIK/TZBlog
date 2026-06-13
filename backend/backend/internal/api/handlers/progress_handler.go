package handlers

import (
	"strconv"

	"github.com/MICBIK/TZBlog/backend/internal/domain/progress"
	"github.com/MICBIK/TZBlog/backend/pkg/response"
	"github.com/gin-gonic/gin"
)

type ProgressHandler struct {
	progressRepo progress.ProgressRepository
}

func NewProgressHandler(progressRepo progress.ProgressRepository) *ProgressHandler {
	return &ProgressHandler{progressRepo: progressRepo}
}

type RecordProgressRequest struct {
	Progress     int `json:"progress" binding:"min=0,max=100"`
	LastPosition int `json:"last_position"`
}

func (h *ProgressHandler) RecordProgress(c *gin.Context) {
	articleID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "Invalid article ID")
		return
	}

	var req RecordProgressRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request")
		return
	}

	userID := c.GetInt64("user_id")

	p := &progress.UserReadProgress{
		UserID:       userID,
		ArticleID:    articleID,
		Progress:     req.Progress,
		LastPosition: req.LastPosition,
	}

	if err := h.progressRepo.SaveProgress(p); err != nil {
		response.InternalError(c, "Failed to save progress")
		return
	}

	response.Success(c, p)
}

func (h *ProgressHandler) GetProgress(c *gin.Context) {
	articleID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "Invalid article ID")
		return
	}

	userID := c.GetInt64("user_id")

	p, err := h.progressRepo.GetProgress(userID, articleID)
	if err != nil {
		response.InternalError(c, "Failed to get progress")
		return
	}

	if p == nil {
		response.Success(c, gin.H{"progress": 0, "last_position": 0})
		return
	}

	response.Success(c, p)
}
