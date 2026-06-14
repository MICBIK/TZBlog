package config

import (
	"context"
	"database/sql"
	"fmt"
	"sync"
	"time"

	"github.com/MICBIK/TZBlog/backend/pkg/logger"
	"go.uber.org/zap"
)

// ConnectionPoolMonitor monitors database connection pool health
type ConnectionPoolMonitor struct {
	db              *sql.DB
	alertThresholds PoolAlertThresholds
	mu              sync.RWMutex
	metrics         *PoolMetrics
	stopChan        chan struct{}
	running         bool
}

// PoolAlertThresholds defines thresholds for connection pool alerts
type PoolAlertThresholds struct {
	MaxUtilization    float64       // Alert if utilization > this (e.g., 0.8 = 80%)
	MaxWaitDuration   time.Duration // Alert if wait time > this
	MaxWaitCount      int64         // Alert if wait count > this in interval
	MaxIdleClosed     int64         // Alert if idle closed > this in interval
	CheckInterval     time.Duration // How often to check metrics
}

// DefaultPoolAlertThresholds returns default alert thresholds
func DefaultPoolAlertThresholds() PoolAlertThresholds {
	return PoolAlertThresholds{
		MaxUtilization:  0.8,              // 80% utilization
		MaxWaitDuration: 100 * time.Millisecond,
		MaxWaitCount:    100,
		MaxIdleClosed:   50,
		CheckInterval:   30 * time.Second,
	}
}

// PoolMetrics stores historical pool metrics
type PoolMetrics struct {
	mu              sync.RWMutex
	currentStats    sql.DBStats
	previousStats   sql.DBStats
	alerts          []PoolAlert
	lastCheckTime   time.Time
}

// PoolAlert represents a connection pool alert
type PoolAlert struct {
	Timestamp time.Time
	Level     string // INFO, WARNING, ERROR
	Message   string
	Stats     sql.DBStats
}

// NewConnectionPoolMonitor creates a new connection pool monitor
func NewConnectionPoolMonitor(db *sql.DB, thresholds PoolAlertThresholds) *ConnectionPoolMonitor {
	return &ConnectionPoolMonitor{
		db:              db,
		alertThresholds: thresholds,
		metrics: &PoolMetrics{
			lastCheckTime: time.Now(),
		},
		stopChan: make(chan struct{}),
	}
}

// Start begins monitoring the connection pool
func (m *ConnectionPoolMonitor) Start(ctx context.Context) {
	m.mu.Lock()
	if m.running {
		m.mu.Unlock()
		return
	}
	m.running = true
	m.mu.Unlock()

	logger.Info("Starting connection pool monitor",
		zap.Duration("check_interval", m.alertThresholds.CheckInterval))

	ticker := time.NewTicker(m.alertThresholds.CheckInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			logger.Info("Connection pool monitor stopped by context")
			m.running = false
			return
		case <-m.stopChan:
			logger.Info("Connection pool monitor stopped")
			m.running = false
			return
		case <-ticker.C:
			m.checkPoolHealth()
		}
	}
}

// Stop stops the connection pool monitor
func (m *ConnectionPoolMonitor) Stop() {
	m.mu.Lock()
	defer m.mu.Unlock()

	if !m.running {
		return
	}

	close(m.stopChan)
}

// checkPoolHealth checks current pool health and generates alerts
func (m *ConnectionPoolMonitor) checkPoolHealth() {
	stats := m.db.Stats()

	m.metrics.mu.Lock()
	m.metrics.previousStats = m.metrics.currentStats
	m.metrics.currentStats = stats
	now := time.Now()
	elapsed := now.Sub(m.metrics.lastCheckTime)
	m.metrics.lastCheckTime = now
	m.metrics.mu.Unlock()

	// Calculate utilization
	utilization := float64(stats.InUse) / float64(stats.MaxOpenConnections)

	// Check utilization threshold
	if utilization > m.alertThresholds.MaxUtilization {
		alert := PoolAlert{
			Timestamp: now,
			Level:     "WARNING",
			Message: fmt.Sprintf("High connection pool utilization: %.1f%% (%d/%d connections in use)",
				utilization*100, stats.InUse, stats.MaxOpenConnections),
			Stats: stats,
		}
		m.addAlert(alert)
		logger.Warn(alert.Message,
			zap.Int("in_use", stats.InUse),
			zap.Int("max_open", stats.MaxOpenConnections),
			zap.Float64("utilization", utilization))
	}

	// Check wait duration
	avgWaitDuration := time.Duration(0)
	if stats.WaitCount > 0 {
		avgWaitDuration = stats.WaitDuration / time.Duration(stats.WaitCount)
	}
	if avgWaitDuration > m.alertThresholds.MaxWaitDuration {
		alert := PoolAlert{
			Timestamp: now,
			Level:     "WARNING",
			Message: fmt.Sprintf("High average wait duration: %v", avgWaitDuration),
			Stats: stats,
		}
		m.addAlert(alert)
		logger.Warn(alert.Message,
			zap.Duration("avg_wait", avgWaitDuration),
			zap.Int64("wait_count", stats.WaitCount))
	}

	// Check wait count increase
	waitCountIncrease := stats.WaitCount - m.metrics.previousStats.WaitCount
	if waitCountIncrease > m.alertThresholds.MaxWaitCount {
		alert := PoolAlert{
			Timestamp: now,
			Level:     "WARNING",
			Message: fmt.Sprintf("High wait count increase: %d waits in %v",
				waitCountIncrease, elapsed),
			Stats: stats,
		}
		m.addAlert(alert)
		logger.Warn(alert.Message,
			zap.Int64("wait_count_increase", waitCountIncrease),
			zap.Duration("interval", elapsed))
	}

	// Check idle closed connections
	idleClosedIncrease := stats.MaxIdleClosed - m.metrics.previousStats.MaxIdleClosed
	if idleClosedIncrease > m.alertThresholds.MaxIdleClosed {
		alert := PoolAlert{
			Timestamp: now,
			Level:     "INFO",
			Message: fmt.Sprintf("High idle connection closures: %d in %v",
				idleClosedIncrease, elapsed),
			Stats: stats,
		}
		m.addAlert(alert)
		logger.Info(alert.Message,
			zap.Int64("idle_closed_increase", idleClosedIncrease),
			zap.Duration("interval", elapsed))
	}

	// Log healthy status periodically
	if len(m.metrics.alerts) == 0 {
		logger.Debug("Connection pool healthy",
			zap.Int("in_use", stats.InUse),
			zap.Int("idle", stats.Idle),
			zap.Int("open", stats.OpenConnections),
			zap.Float64("utilization", utilization))
	}
}

// addAlert adds an alert to the metrics
func (m *ConnectionPoolMonitor) addAlert(alert PoolAlert) {
	m.metrics.mu.Lock()
	defer m.metrics.mu.Unlock()

	// Keep only last 100 alerts
	if len(m.metrics.alerts) >= 100 {
		m.metrics.alerts = m.metrics.alerts[1:]
	}
	m.metrics.alerts = append(m.metrics.alerts, alert)
}

// GetCurrentStats returns current pool statistics
func (m *ConnectionPoolMonitor) GetCurrentStats() sql.DBStats {
	m.metrics.mu.RLock()
	defer m.metrics.mu.RUnlock()
	return m.metrics.currentStats
}

// GetRecentAlerts returns recent alerts
func (m *ConnectionPoolMonitor) GetRecentAlerts(count int) []PoolAlert {
	m.metrics.mu.RLock()
	defer m.metrics.mu.RUnlock()

	if count > len(m.metrics.alerts) {
		count = len(m.metrics.alerts)
	}

	alerts := make([]PoolAlert, count)
	copy(alerts, m.metrics.alerts[len(m.metrics.alerts)-count:])
	return alerts
}

// GetHealthReport returns a comprehensive health report
func (m *ConnectionPoolMonitor) GetHealthReport() PoolHealthReport {
	stats := m.GetCurrentStats()
	alerts := m.GetRecentAlerts(10)

	utilization := float64(stats.InUse) / float64(stats.MaxOpenConnections)

	health := "HEALTHY"
	if utilization > 0.9 {
		health = "CRITICAL"
	} else if utilization > m.alertThresholds.MaxUtilization {
		health = "WARNING"
	}

	avgWaitDuration := time.Duration(0)
	if stats.WaitCount > 0 {
		avgWaitDuration = stats.WaitDuration / time.Duration(stats.WaitCount)
	}

	return PoolHealthReport{
		Health:             health,
		Utilization:        utilization,
		InUse:              stats.InUse,
		Idle:               stats.Idle,
		MaxOpen:            stats.MaxOpenConnections,
		OpenConnections:    stats.OpenConnections,
		WaitCount:          stats.WaitCount,
		WaitDuration:       stats.WaitDuration,
		AvgWaitDuration:    avgWaitDuration,
		MaxIdleClosed:      stats.MaxIdleClosed,
		MaxLifetimeClosed:  stats.MaxLifetimeClosed,
		RecentAlerts:       alerts,
		Timestamp:          time.Now(),
	}
}

// PoolHealthReport represents a comprehensive pool health report
type PoolHealthReport struct {
	Health             string
	Utilization        float64
	InUse              int
	Idle               int
	MaxOpen            int
	OpenConnections    int
	WaitCount          int64
	WaitDuration       time.Duration
	AvgWaitDuration    time.Duration
	MaxIdleClosed      int64
	MaxLifetimeClosed  int64
	RecentAlerts       []PoolAlert
	Timestamp          time.Time
}

// ConnectionLeakDetector detects potential connection leaks
type ConnectionLeakDetector struct {
	monitor       *ConnectionPoolMonitor
	baselineInUse int
	checkCount    int
	leakThreshold int // If in-use stays above baseline + threshold for N checks, alert
}

// NewConnectionLeakDetector creates a new leak detector
func NewConnectionLeakDetector(monitor *ConnectionPoolMonitor) *ConnectionLeakDetector {
	return &ConnectionLeakDetector{
		monitor:       monitor,
		leakThreshold: 5,
	}
}

// CheckForLeaks checks if there might be a connection leak
func (d *ConnectionLeakDetector) CheckForLeaks() *LeakReport {
	stats := d.monitor.GetCurrentStats()

	// Initialize baseline
	if d.baselineInUse == 0 {
		d.baselineInUse = stats.InUse
		return nil
	}

	// Check if in-use connections are consistently high
	if stats.InUse > d.baselineInUse+d.leakThreshold {
		d.checkCount++

		// If high for 5 consecutive checks, likely a leak
		if d.checkCount >= 5 {
			return &LeakReport{
				Suspected:     true,
				BaselineInUse: d.baselineInUse,
				CurrentInUse:  stats.InUse,
				Difference:    stats.InUse - d.baselineInUse,
				CheckCount:    d.checkCount,
				Message: fmt.Sprintf("Potential connection leak detected: %d connections in use (baseline: %d, difference: %d) for %d checks",
					stats.InUse, d.baselineInUse, stats.InUse-d.baselineInUse, d.checkCount),
			}
		}
	} else {
		// Reset if back to normal
		d.checkCount = 0
		d.baselineInUse = stats.InUse
	}

	return nil
}

// LeakReport represents a connection leak report
type LeakReport struct {
	Suspected     bool
	BaselineInUse int
	CurrentInUse  int
	Difference    int
	CheckCount    int
	Message       string
}

// ResetBaseline resets the baseline in-use connections
func (d *ConnectionLeakDetector) ResetBaseline() {
	stats := d.monitor.GetCurrentStats()
	d.baselineInUse = stats.InUse
	d.checkCount = 0
}
