package handlers

import (
	"crypto/sha256"
	"encoding/hex"
	"strconv"

	"github.com/MICBIK/TZBlog/backend/internal/domain/view"
	"github.com/MICBIK/TZBlog/backend/pkg/response"
	"github.com/gin-gonic/gin"
)

type ViewHandler struct {
	viewRepo view.ViewRepository
}

func NewViewHandler(viewRepo view.ViewRepository) *ViewHandler {
	return &ViewHandler{viewRepo: viewRepo}
}

func (h *ViewHandler) RecordView(c *gin.Context) {
	articleID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "Invalid article ID")
		return
	}

	ip := c.ClientIP()
	ipHash := hashIP(ip)

	// 1小时内同IP只计数一次
	canRecord, err := h.viewRepo.CanRecordView(articleID, ipHash)
	if err != nil {
		response.InternalError(c, "Failed to check view")
		return
	}

	if canRecord {
		newView := &view.ArticleView{
			ArticleID: articleID,
			IPAddress: ip,
			UserAgent: c.GetHeader("User-Agent"),
		}

		if userID, exists := c.Get("user_id"); exists {
			uid := userID.(int64)
			newView.UserID = &uid
		}

		if err := h.viewRepo.RecordView(newView); err != nil {
			response.InternalError(c, "Failed to record view")
			return
		}
	}

	response.Success(c, gin.H{"recorded": canRecord})
}

func (h *ViewHandler) GetHotArticles(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	articles, err := h.viewRepo.GetHotArticles(limit)
	if err != nil {
		response.InternalError(c, "Failed to get hot articles")
		return
	}

	response.Success(c, articles)
}

func hashIP(ip string) string {
	hash := sha256.Sum256([]byte(ip))
	return hex.EncodeToString(hash[:])
}
