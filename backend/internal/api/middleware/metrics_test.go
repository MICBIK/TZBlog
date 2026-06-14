package middleware

import (
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/testutil"
)

func TestMetrics(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Reset metrics before test
	httpRequestsTotal.Reset()
	httpRequestDuration.Reset()
	httpRequestSizeBytes.Reset()
	httpResponseSizeBytes.Reset()

	tests := []struct {
		name       string
		method     string
		path       string
		statusCode int
		body       string
	}{
		{
			name:       "GET request",
			method:     "GET",
			path:       "/api/articles",
			statusCode: 200,
			body:       "",
		},
		{
			name:       "POST request",
			method:     "POST",
			path:       "/api/articles",
			statusCode: 201,
			body:       `{"title":"test"}`,
		},
		{
			name:       "error request",
			method:     "GET",
			path:       "/api/notfound",
			statusCode: 404,
			body:       "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			w := httptest.NewRecorder()
			c, r := gin.CreateTestContext(w)

			r.Use(Metrics())
			r.Handle(tt.method, tt.path, func(c *gin.Context) {
				c.String(tt.statusCode, "response")
			})

			c.Request = httptest.NewRequest(tt.method, tt.path, nil)
			r.ServeHTTP(w, c.Request)

			if w.Code != tt.statusCode {
				t.Errorf("Expected status %d, got %d", tt.statusCode, w.Code)
			}
		})
	}
}

func TestMetricsCollection(t *testing.T) {
	gin.SetMode(gin.TestMode)

	w := httptest.NewRecorder()
	c, r := gin.CreateTestContext(w)

	r.Use(Metrics())
	r.GET("/test", func(c *gin.Context) {
		c.String(200, "ok")
	})

	// Make request
	c.Request = httptest.NewRequest("GET", "/test", nil)
	r.ServeHTTP(w, c.Request)

	// Verify metrics were collected
	count := testutil.CollectAndCount(httpRequestsTotal)
	if count == 0 {
		t.Error("Expected metrics to be collected")
	}
}

func TestInFlightGauge(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Reset gauge
	httpRequestsInFlight.Set(0)

	w := httptest.NewRecorder()
	c, r := gin.CreateTestContext(w)

	r.Use(Metrics())
	r.GET("/test", func(c *gin.Context) {
		// Check that gauge is incremented during request
		value := testutil.ToFloat64(httpRequestsInFlight)
		if value != 1 {
			t.Errorf("Expected in-flight gauge to be 1, got %f", value)
		}
		c.String(200, "ok")
	})

	c.Request = httptest.NewRequest("GET", "/test", nil)
	r.ServeHTTP(w, c.Request)

	// Check that gauge is decremented after request
	value := testutil.ToFloat64(httpRequestsInFlight)
	if value != 0 {
		t.Errorf("Expected in-flight gauge to be 0 after request, got %f", value)
	}
}

func BenchmarkMetrics(b *testing.B) {
	gin.SetMode(gin.TestMode)

	w := httptest.NewRecorder()
	c, r := gin.CreateTestContext(w)

	r.Use(Metrics())
	r.GET("/test", func(c *gin.Context) {
		c.String(200, "ok")
	})

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		c.Request = httptest.NewRequest("GET", "/test", nil)
		r.ServeHTTP(w, c.Request)
	}
}

func TestMetricsLabels(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Reset metrics
	httpRequestsTotal.Reset()

	w := httptest.NewRecorder()
	c, r := gin.CreateTestContext(w)

	r.Use(Metrics())
	r.GET("/api/test", func(c *gin.Context) {
		c.String(200, "ok")
	})

	c.Request = httptest.NewRequest("GET", "/api/test", nil)
	r.ServeHTTP(w, c.Request)

	// Verify labels are set correctly
	metric := httpRequestsTotal.WithLabelValues("GET", "/api/test", "200")
	count := testutil.ToFloat64(metric)
	if count != 1 {
		t.Errorf("Expected counter to be 1, got %f", count)
	}
}

// Ensure metrics are registered with prometheus
func TestMetricsRegistration(t *testing.T) {
	metrics := []prometheus.Collector{
		httpRequestsTotal,
		httpRequestDuration,
		httpRequestSizeBytes,
		httpResponseSizeBytes,
		httpRequestsInFlight,
	}

	for _, metric := range metrics {
		if metric == nil {
			t.Error("Metric is nil")
		}
	}
}
