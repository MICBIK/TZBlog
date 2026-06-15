package monitoring

import (
	"database/sql"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func TestUpdateDBMetrics(t *testing.T) {
	stats := sql.DBStats{
		OpenConnections:   10,
		InUse:             5,
		Idle:              5,
		WaitCount:         100,
		WaitDuration:      time.Second * 10,
		MaxIdleClosed:     20,
		MaxLifetimeClosed: 15,
	}

	// Should not panic
	UpdateDBMetrics(stats)
}

func TestHTTPMetricsMiddleware(t *testing.T) {
	gin.SetMode(gin.TestMode)

	router := gin.New()
	router.Use(HTTPMetricsMiddleware())
	router.GET("/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "test"})
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/test", nil)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestRecordCacheHit(t *testing.T) {
	// Should not panic
	RecordCacheHit("redis")
	RecordCacheHit("memory")
}

func TestRecordCacheMiss(t *testing.T) {
	// Should not panic
	RecordCacheMiss("redis")
	RecordCacheMiss("memory")
}

func TestRecordCacheOperation(t *testing.T) {
	// Should not panic
	RecordCacheOperation("redis", "get", time.Millisecond*10)
	RecordCacheOperation("redis", "set", time.Millisecond*5)
	RecordCacheOperation("memory", "delete", time.Millisecond*2)
}
