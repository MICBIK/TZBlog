package handlers

import (
	"runtime"
	"time"

	"github.com/MICBIK/TZBlog/backend/pkg/response"
	"github.com/gin-gonic/gin"
)

type HealthHandler struct {
	startTime time.Time
}

func NewHealthHandler() *HealthHandler {
	return &HealthHandler{
		startTime: time.Now(),
	}
}

// HealthCheck returns basic health status
// @Summary Health check endpoint
// @Tags Health
// @Success 200 {object} map[string]interface{}
// @Router /health [get]
func (h *HealthHandler) HealthCheck(c *gin.Context) {
	response.Success(c, gin.H{
		"status": "ok",
		"time":   time.Now().Unix(),
	})
}

// Readiness checks if service is ready to accept traffic
// @Summary Readiness probe
// @Tags Health
// @Success 200 {object} map[string]interface{}
// @Router /ready [get]
func (h *HealthHandler) Readiness(c *gin.Context) {
	// TODO: Check database connection
	// TODO: Check Redis connection

	response.Success(c, gin.H{
		"ready": true,
		"time":  time.Now().Unix(),
	})
}

// Liveness checks if service is alive
// @Summary Liveness probe
// @Tags Health
// @Success 200 {object} map[string]interface{}
// @Router /live [get]
func (h *HealthHandler) Liveness(c *gin.Context) {
	response.Success(c, gin.H{
		"alive": true,
		"time":  time.Now().Unix(),
	})
}

// Metrics returns basic metrics
// @Summary Service metrics
// @Tags Health
// @Success 200 {object} map[string]interface{}
// @Router /metrics [get]
func (h *HealthHandler) Metrics(c *gin.Context) {
	var m runtime.MemStats
	runtime.ReadMemStats(&m)

	uptime := time.Since(h.startTime)

	response.Success(c, gin.H{
		"uptime_seconds": uptime.Seconds(),
		"memory": gin.H{
			"alloc_mb":       m.Alloc / 1024 / 1024,
			"total_alloc_mb": m.TotalAlloc / 1024 / 1024,
			"sys_mb":         m.Sys / 1024 / 1024,
			"num_gc":         m.NumGC,
		},
		"goroutines": runtime.NumGoroutine(),
	})
}
