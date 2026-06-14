package handlers

import (
	"net/http"

	"github.com/MICBIK/TZBlog/backend/pkg/logger"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

// SystemHandler handles system-level operations
type SystemHandler struct{}

// NewSystemHandler creates a new system handler
func NewSystemHandler() *SystemHandler {
	return &SystemHandler{}
}

// SetLogLevelRequest represents the request to set log level
type SetLogLevelRequest struct {
	Level string `json:"level" binding:"required,oneof=debug info warn error"`
}

// SetLogLevel godoc
// @Summary      Set log level dynamically
// @Description  Changes the application log level at runtime
// @Tags         system
// @Accept       json
// @Produce      json
// @Param        request body SetLogLevelRequest true "Log level (debug, info, warn, error)"
// @Success      200 {object} map[string]interface{} "Log level updated successfully"
// @Failure      400 {object} map[string]interface{} "Invalid request"
// @Failure      500 {object} map[string]interface{} "Internal server error"
// @Router       /system/log-level [put]
// @Security     BearerAuth
func (h *SystemHandler) SetLogLevel(c *gin.Context) {
	var req SetLogLevelRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "INVALID_REQUEST",
				"message": "Invalid request body",
				"details": err.Error(),
			},
		})
		return
	}

	// Set log level
	if err := logger.SetLevel(req.Level); err != nil {
		logger.Error("Failed to set log level", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "SET_LEVEL_FAILED",
				"message": "Failed to set log level",
				"details": err.Error(),
			},
		})
		return
	}

	logger.Info("Log level changed", zap.String("new_level", req.Level))

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"level":   req.Level,
			"message": "Log level updated successfully",
		},
	})
}

// GetLogLevel godoc
// @Summary      Get current log level
// @Description  Returns the current application log level
// @Tags         system
// @Produce      json
// @Success      200 {object} map[string]interface{} "Current log level"
// @Router       /system/log-level [get]
// @Security     BearerAuth
func (h *SystemHandler) GetLogLevel(c *gin.Context) {
	level := logger.GetLevel()

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"level": level,
		},
	})
}
