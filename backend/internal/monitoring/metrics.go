package monitoring

import (
	"database/sql"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
)

var (
	// Database metrics
	dbConnectionsOpen = promauto.NewGauge(prometheus.GaugeOpts{
		Name: "db_connections_open",
		Help: "Number of open database connections",
	})

	dbConnectionsInUse = promauto.NewGauge(prometheus.GaugeOpts{
		Name: "db_connections_in_use",
		Help: "Number of database connections in use",
	})

	dbConnectionsIdle = promauto.NewGauge(prometheus.GaugeOpts{
		Name: "db_connections_idle",
		Help: "Number of idle database connections",
	})

	dbConnectionsWaitCount = promauto.NewCounter(prometheus.CounterOpts{
		Name: "db_connections_wait_count_total",
		Help: "Total number of connections waited for",
	})

	dbConnectionsWaitDuration = promauto.NewCounter(prometheus.CounterOpts{
		Name: "db_connections_wait_duration_seconds_total",
		Help: "Total time blocked waiting for new connections",
	})

	dbConnectionsMaxIdleClosed = promauto.NewCounter(prometheus.CounterOpts{
		Name: "db_connections_max_idle_closed_total",
		Help: "Total number of connections closed due to max idle",
	})

	dbConnectionsMaxLifetimeClosed = promauto.NewCounter(prometheus.CounterOpts{
		Name: "db_connections_max_lifetime_closed_total",
		Help: "Total number of connections closed due to max lifetime",
	})

	// HTTP metrics
	httpRequestsTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "http_requests_total",
			Help: "Total number of HTTP requests",
		},
		[]string{"method", "endpoint", "status"},
	)

	httpRequestDuration = promauto.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "http_request_duration_seconds",
			Help:    "HTTP request duration in seconds",
			Buckets: prometheus.DefBuckets,
		},
		[]string{"method", "endpoint"},
	)

	httpRequestSize = promauto.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "http_request_size_bytes",
			Help:    "HTTP request size in bytes",
			Buckets: []float64{100, 1000, 5000, 10000, 50000, 100000, 500000, 1000000},
		},
		[]string{"method", "endpoint"},
	)

	httpResponseSize = promauto.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "http_response_size_bytes",
			Help:    "HTTP response size in bytes",
			Buckets: []float64{100, 1000, 5000, 10000, 50000, 100000, 500000, 1000000},
		},
		[]string{"method", "endpoint"},
	)

	// Cache metrics
	cacheHits = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "cache_hits_total",
			Help: "Total number of cache hits",
		},
		[]string{"cache_type"},
	)

	cacheMisses = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "cache_misses_total",
			Help: "Total number of cache misses",
		},
		[]string{"cache_type"},
	)

	cacheOperationDuration = promauto.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "cache_operation_duration_seconds",
			Help:    "Cache operation duration in seconds",
			Buckets: []float64{0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1.0},
		},
		[]string{"cache_type", "operation"},
	)
)

// UpdateDBMetrics updates database connection pool metrics
func UpdateDBMetrics(stats sql.DBStats) {
	dbConnectionsOpen.Set(float64(stats.OpenConnections))
	dbConnectionsInUse.Set(float64(stats.InUse))
	dbConnectionsIdle.Set(float64(stats.Idle))
	dbConnectionsWaitCount.Add(float64(stats.WaitCount))
	dbConnectionsWaitDuration.Add(stats.WaitDuration.Seconds())
	dbConnectionsMaxIdleClosed.Add(float64(stats.MaxIdleClosed))
	dbConnectionsMaxLifetimeClosed.Add(float64(stats.MaxLifetimeClosed))
}

// HTTPMetricsMiddleware tracks HTTP request metrics
func HTTPMetricsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		path := c.FullPath()
		if path == "" {
			path = "unknown"
		}

		// Track request size
		if c.Request.ContentLength > 0 {
			httpRequestSize.WithLabelValues(c.Request.Method, path).Observe(float64(c.Request.ContentLength))
		}

		c.Next()

		// Track duration
		duration := time.Since(start).Seconds()
		httpRequestDuration.WithLabelValues(c.Request.Method, path).Observe(duration)

		// Track total requests
		status := c.Writer.Status()
		httpRequestsTotal.WithLabelValues(c.Request.Method, path, http.StatusText(status)).Inc()

		// Track response size
		httpResponseSize.WithLabelValues(c.Request.Method, path).Observe(float64(c.Writer.Size()))
	}
}

// RecordCacheHit records a cache hit
func RecordCacheHit(cacheType string) {
	cacheHits.WithLabelValues(cacheType).Inc()
}

// RecordCacheMiss records a cache miss
func RecordCacheMiss(cacheType string) {
	cacheMisses.WithLabelValues(cacheType).Inc()
}

// RecordCacheOperation records a cache operation duration
func RecordCacheOperation(cacheType, operation string, duration time.Duration) {
	cacheOperationDuration.WithLabelValues(cacheType, operation).Observe(duration.Seconds())
}
