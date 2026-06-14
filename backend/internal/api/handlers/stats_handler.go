package handlers

import (
	"github.com/MICBIK/TZBlog/backend/internal/domain/stats"
	"github.com/MICBIK/TZBlog/backend/pkg/response"
	"github.com/gin-gonic/gin"
)

type StatsHandler struct {
	statsRepo stats.StatsRepository
}

func NewStatsHandler(statsRepo stats.StatsRepository) *StatsHandler {
	return &StatsHandler{statsRepo: statsRepo}
}

func (h *StatsHandler) GetOverviewStats(c *gin.Context) {
	overview, err := h.statsRepo.GetOverviewStats()
	if err != nil {
		response.InternalError(c, "Failed to get overview stats")
		return
	}

	response.Success(c, overview)
}

func (h *StatsHandler) GetArticleStats(c *gin.Context) {
	articleStats, err := h.statsRepo.GetArticleStats()
	if err != nil {
		response.InternalError(c, "Failed to get article stats")
		return
	}

	response.Success(c, articleStats)
}

func (h *StatsHandler) GetTrafficStats(c *gin.Context) {
	trafficStats, err := h.statsRepo.GetTrafficStats()
	if err != nil {
		response.InternalError(c, "Failed to get traffic stats")
		return
	}

	response.Success(c, trafficStats)
}
