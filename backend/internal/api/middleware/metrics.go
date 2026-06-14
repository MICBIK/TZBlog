package middleware

import (
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
)

var (
	// HTTP 请求总数
	httpRequestsTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "http_requests_total",
			Help: "Total number of HTTP requests",
		},
		[]string{"method", "path", "status"},
	)

	// HTTP 请求响应时间（毫秒）
	httpRequestDuration = promauto.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "http_request_duration_milliseconds",
			Help:    "HTTP request latency in milliseconds",
			Buckets: []float64{5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000},
		},
		[]string{"method", "path", "status"},
	)

	// HTTP 请求大小（字节）
	httpRequestSizeBytes = promauto.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "http_request_size_bytes",
			Help:    "HTTP request size in bytes",
			Buckets: prometheus.ExponentialBuckets(100, 10, 7), // 100B -> 100MB
		},
		[]string{"method", "path"},
	)

	// HTTP 响应大小（字节）
	httpResponseSizeBytes = promauto.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "http_response_size_bytes",
			Help:    "HTTP response size in bytes",
			Buckets: prometheus.ExponentialBuckets(100, 10, 7), // 100B -> 100MB
		},
		[]string{"method", "path", "status"},
	)

	// 活跃请求数
	httpRequestsInFlight = promauto.NewGauge(
		prometheus.GaugeOpts{
			Name: "http_requests_in_flight",
			Help: "Current number of HTTP requests being processed",
		},
	)
)

// Metrics 收集 Prometheus 指标的中间件
func Metrics() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path

		// 增加活跃请求计数
		httpRequestsInFlight.Inc()
		defer httpRequestsInFlight.Dec()

		// 记录请求大小
		httpRequestSizeBytes.WithLabelValues(
			c.Request.Method,
			path,
		).Observe(float64(c.Request.ContentLength))

		// 处理请求
		c.Next()

		// 计算耗时（毫秒）
		duration := time.Since(start).Milliseconds()
		status := strconv.Itoa(c.Writer.Status())

		// 记录指标
		httpRequestsTotal.WithLabelValues(
			c.Request.Method,
			path,
			status,
		).Inc()

		httpRequestDuration.WithLabelValues(
			c.Request.Method,
			path,
			status,
		).Observe(float64(duration))

		httpResponseSizeBytes.WithLabelValues(
			c.Request.Method,
			path,
			status,
		).Observe(float64(c.Writer.Size()))
	}
}
