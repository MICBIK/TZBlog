package config

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/MICBIK/TZBlog/backend/pkg/logger"
	"go.uber.org/zap"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	gormLogger "gorm.io/gorm/logger"
)

// DatabasePoolConfig holds connection pool configuration
type DatabasePoolConfig struct {
	MaxOpenConns    int
	MaxIdleConns    int
	ConnMaxLifetime time.Duration
	ConnMaxIdleTime time.Duration
}

// DefaultDatabasePoolConfig returns default pool configuration
func DefaultDatabasePoolConfig() *DatabasePoolConfig {
	return &DatabasePoolConfig{
		MaxOpenConns:    25,  // Maximum number of open connections
		MaxIdleConns:    5,   // Maximum number of idle connections
		ConnMaxLifetime: time.Hour,      // Maximum lifetime of a connection
		ConnMaxIdleTime: time.Minute * 5, // Maximum idle time of a connection
	}
}

// ValidatePoolConfig validates connection pool configuration
// Fixes H13.6: Connection pool configuration validation
func (p *DatabasePoolConfig) Validate() error {
	if p.MaxOpenConns <= 0 {
		return fmt.Errorf("max_open_conns must be positive, got %d", p.MaxOpenConns)
	}

	if p.MaxIdleConns <= 0 {
		return fmt.Errorf("max_idle_conns must be positive, got %d", p.MaxIdleConns)
	}

	if p.MaxIdleConns > p.MaxOpenConns {
		return fmt.Errorf("max_idle_conns (%d) cannot exceed max_open_conns (%d)",
			p.MaxIdleConns, p.MaxOpenConns)
	}

	if p.ConnMaxLifetime <= 0 {
		return fmt.Errorf("conn_max_lifetime must be positive, got %v", p.ConnMaxLifetime)
	}

	if p.ConnMaxIdleTime <= 0 {
		return fmt.Errorf("conn_max_idle_time must be positive, got %v", p.ConnMaxIdleTime)
	}

	if p.ConnMaxIdleTime > p.ConnMaxLifetime {
		return fmt.Errorf("conn_max_idle_time (%v) cannot exceed conn_max_lifetime (%v)",
			p.ConnMaxIdleTime, p.ConnMaxLifetime)
	}

	return nil
}

// ValidateDatabasePassword validates database password strength
// Fixes C-010: Database password validation
func ValidateDatabasePassword(password string, isProduction bool) error {
	if password == "" {
		return fmt.Errorf("database password is required")
	}

	if isProduction {
		if len(password) < 32 {
			return fmt.Errorf("production password must be ≥32 characters (current: %d)", len(password))
		}

		// 禁止常见弱密码
		weak := []string{"postgres", "password", "tzblog", "admin", "123456"}
		for _, w := range weak {
			if strings.Contains(strings.ToLower(password), w) {
				return fmt.Errorf("password must not contain common words: %s", w)
			}
		}
	}

	return nil
}

// ValidateDatabaseConfig validates database configuration
func ValidateDatabaseConfig(c *DatabaseConfig) error {
	if c.Host == "" {
		return fmt.Errorf("database host is required")
	}

	if c.Port <= 0 || c.Port > 65535 {
		return fmt.Errorf("database port must be between 1 and 65535, got %d", c.Port)
	}

	if c.User == "" {
		return fmt.Errorf("database user is required")
	}

	if c.DBName == "" {
		return fmt.Errorf("database name is required")
	}

	return nil
}

// GetDSNSafe returns the data source name for logging (password redacted)
// Fixes C13.1: DSN password exposure in logs
func GetDSNSafe(c *DatabaseConfig) string {
	sslMode := "disable"
	return fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
		c.Host, c.Port, c.User, "***REDACTED***", c.DBName, sslMode)
}

// GetDSNForConnection returns the actual DSN for establishing connection
func GetDSNForConnection(c *DatabaseConfig) string {
	sslMode := "disable"
	return fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
		c.Host, c.Port, c.User, c.Password, c.DBName, sslMode)
}

// slowQueryLogger 自定义慢查询日志记录器
type slowQueryLogger struct {
	SlowThreshold time.Duration
}

func (l *slowQueryLogger) LogMode(level gormLogger.LogLevel) gormLogger.Interface {
	return l
}

func (l *slowQueryLogger) Info(ctx context.Context, msg string, data ...interface{}) {
	logger.Info(fmt.Sprintf(msg, data...))
}

func (l *slowQueryLogger) Warn(ctx context.Context, msg string, data ...interface{}) {
	logger.Warn(fmt.Sprintf(msg, data...))
}

func (l *slowQueryLogger) Error(ctx context.Context, msg string, data ...interface{}) {
	logger.Error(fmt.Sprintf(msg, data...))
}

func (l *slowQueryLogger) Trace(ctx context.Context, begin time.Time, fc func() (sql string, rowsAffected int64), err error) {
	elapsed := time.Since(begin)
	sql, rows := fc()

	// 记录慢查询（超过阈值）
	if elapsed >= l.SlowThreshold {
		logger.Warn("Slow query detected",
			zap.Duration("duration", elapsed),
			zap.String("sql", sql),
			zap.Int64("rows", rows),
			zap.Error(err),
		)
	}

	// 记录所有查询错误
	if err != nil && err != gorm.ErrRecordNotFound {
		logger.Error("Database query error",
			zap.Duration("duration", elapsed),
			zap.String("sql", sql),
			zap.Int64("rows", rows),
			zap.Error(err),
		)
	}
}

// NewDatabaseConnection creates a new optimized database connection
func NewDatabaseConnection(cfg *DatabaseConfig, poolCfg *DatabasePoolConfig) (*gorm.DB, error) {
	// Validate configuration first
	if err := ValidateDatabaseConfig(cfg); err != nil {
		return nil, fmt.Errorf("invalid database configuration: %w", err)
	}

	if err := poolCfg.Validate(); err != nil {
		return nil, fmt.Errorf("invalid pool configuration: %w", err)
	}

	// 创建慢查询日志记录器（阈值 100ms）
	customLogger := &slowQueryLogger{
		SlowThreshold: 100 * time.Millisecond,
	}

	// Open database connection
	db, err := gorm.Open(postgres.Open(GetDSNForConnection(cfg)), &gorm.Config{
		Logger: customLogger,
		// Enable prepared statement caching for better performance
		PrepareStmt: true,
		// Disable automatic ping on connection (we'll do it explicitly)
		DisableAutomaticPing: false,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	// Get underlying sql.DB to configure connection pool
	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("failed to get sql.DB: %w", err)
	}

	// Configure connection pool for optimal performance
	sqlDB.SetMaxOpenConns(poolCfg.MaxOpenConns)
	sqlDB.SetMaxIdleConns(poolCfg.MaxIdleConns)
	sqlDB.SetConnMaxLifetime(poolCfg.ConnMaxLifetime)
	sqlDB.SetConnMaxIdleTime(poolCfg.ConnMaxIdleTime)

	return db, nil
}

// OptimizedPoolConfig returns production-ready pool configuration
func OptimizedPoolConfig() *DatabasePoolConfig {
	return &DatabasePoolConfig{
		MaxOpenConns:    50,              // Allow up to 50 concurrent connections
		MaxIdleConns:    10,              // Keep 10 idle connections for fast reuse
		ConnMaxLifetime: time.Hour,       // Recycle connections every hour
		ConnMaxIdleTime: time.Minute * 5, // Close idle connections after 5 minutes
	}
}

// HighLoadPoolConfig returns configuration for high-load scenarios
func HighLoadPoolConfig() *DatabasePoolConfig {
	return &DatabasePoolConfig{
		MaxOpenConns:    100,             // Allow up to 100 concurrent connections
		MaxIdleConns:    25,              // Keep 25 idle connections ready
		ConnMaxLifetime: time.Minute * 30, // More aggressive connection recycling
		ConnMaxIdleTime: time.Minute * 3,  // Close idle connections faster
	}
}

// LowLoadPoolConfig returns configuration for low-load scenarios
func LowLoadPoolConfig() *DatabasePoolConfig {
	return &DatabasePoolConfig{
		MaxOpenConns:    10,              // Limit to 10 concurrent connections
		MaxIdleConns:    2,               // Keep only 2 idle connections
		ConnMaxLifetime: time.Hour * 2,   // Keep connections longer
		ConnMaxIdleTime: time.Minute * 10, // Allow longer idle time
	}
}
