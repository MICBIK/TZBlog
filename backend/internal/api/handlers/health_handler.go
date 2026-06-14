package handlers

import (
	"net/http"
	"runtime"
	"time"

	"github.com/MICBIK/TZBlog/backend/internal/api/response"
	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

type HealthHandler struct {
	startTime time.Time
	db        *gorm.DB
	redis     *redis.Client
}

func NewHealthHandler() *HealthHandler {
	return &HealthHandler{
		startTime: time.Now(),
	}
}

func NewHealthHandlerWithDeps(db *gorm.DB, redis *redis.Client) *HealthHandler {
	return &HealthHandler{
		startTime: time.Now(),
		db:        db,
		redis:     redis,
	}
}

// HealthCheck returns basic health status
// @Summary Health check endpoint
// @Tags Health
// @Success 200 {object} map[string]interface{}
// @Router       /api/v1/health [get]
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
// @Failure 503 {object} map[string]interface{}
// @Router       /api/v1/ready [get]
func (h *HealthHandler) Readiness(c *gin.Context) {
	checks := make(map[string]string)
	allHealthy := true

	// Check database connection
	if h.db != nil {
		sqlDB, err := h.db.DB()
		if err != nil {
			// ✅ SEC-005 FIX: Don't expose internal error details
			checks["database"] = "unhealthy"
			allHealthy = false
		} else if err := sqlDB.Ping(); err != nil {
			checks["database"] = "unhealthy"
			allHealthy = false
		} else {
			checks["database"] = "ok"
		}
	} else {
		checks["database"] = "not configured"
	}

	// Check Redis connection
	if h.redis != nil {
		if err := h.redis.Ping(c.Request.Context()).Err(); err != nil {
			// ✅ SEC-005 FIX: Don't expose internal error details
			checks["redis"] = "unhealthy"
			allHealthy = false
		} else {
			checks["redis"] = "ok"
		}
	} else {
		checks["redis"] = "not configured"
	}

	status := http.StatusOK
	if !allHealthy {
		status = http.StatusServiceUnavailable
	}

	c.JSON(status, gin.H{
		"ready":  allHealthy,
		"time":   time.Now().Unix(),
		"checks": checks,
	})
}

// Liveness checks if service is alive
// @Summary Liveness probe
// @Tags Health
// @Success 200 {object} map[string]interface{}
// @Router       /api/v1/live [get]
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
// @Router       /api/v1/metrics [get]
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
