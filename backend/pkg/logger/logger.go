package logger

import (
	"fmt"
	"os"
	"strings"
	"sync"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

var (
	globalLogger *zap.Logger
	atomicLevel  zap.AtomicLevel
	mu           sync.RWMutex
)

// Init 初始化全局 logger
func Init(env string) error {
	var config zap.Config

	if env == "production" {
		config = zap.NewProductionConfig()
		config.EncoderConfig.TimeKey = "timestamp"
		config.EncoderConfig.EncodeTime = zapcore.ISO8601TimeEncoder
	} else {
		config = zap.NewDevelopmentConfig()
		config.EncoderConfig.EncodeLevel = zapcore.CapitalColorLevelEncoder
	}

	// Store atomic level for dynamic updates
	atomicLevel = config.Level

	logger, err := config.Build(
		zap.AddCaller(),
		zap.AddCallerSkip(1),
		zap.AddStacktrace(zapcore.ErrorLevel),
	)
	if err != nil {
		return err
	}

	mu.Lock()
	globalLogger = logger
	mu.Unlock()

	return nil
}

// GetLogger 获取全局 logger
func GetLogger() *zap.Logger {
	mu.RLock()
	defer mu.RUnlock()

	if globalLogger == nil {
		// 如果未初始化，使用默认开发配置
		logger, _ := zap.NewDevelopment()
		globalLogger = logger
	}
	return globalLogger
}

// SetLevel 动态设置日志级别
func SetLevel(level string) error {
	var zapLevel zapcore.Level

	switch level {
	case "debug":
		zapLevel = zapcore.DebugLevel
	case "info":
		zapLevel = zapcore.InfoLevel
	case "warn":
		zapLevel = zapcore.WarnLevel
	case "error":
		zapLevel = zapcore.ErrorLevel
	default:
		return fmt.Errorf("invalid log level: %s (must be debug, info, warn, or error)", level)
	}

	mu.Lock()
	defer mu.Unlock()

	if atomicLevel == (zap.AtomicLevel{}) {
		return fmt.Errorf("logger not initialized")
	}

	atomicLevel.SetLevel(zapLevel)
	return nil
}

// GetLevel 获取当前日志级别
func GetLevel() string {
	mu.RLock()
	defer mu.RUnlock()

	if atomicLevel == (zap.AtomicLevel{}) {
		return "unknown"
	}

	return atomicLevel.Level().String()
}

// Sync 刷新日志缓冲区
func Sync() error {
	if globalLogger != nil {
		err := globalLogger.Sync()
		if isIgnorableSyncError(err) {
			return nil
		}
		return err
	}
	return nil
}

func isIgnorableSyncError(err error) bool {
	if err == nil {
		return false
	}

	msg := err.Error()
	if !(strings.Contains(msg, "/dev/stderr") || strings.Contains(msg, "/dev/stdout")) {
		return false
	}

	return strings.Contains(msg, "bad file descriptor") || strings.Contains(msg, "invalid argument")
}

// Debug 输出 Debug 级别日志
func Debug(msg string, fields ...zap.Field) {
	GetLogger().Debug(msg, fields...)
}

// Info 输出 Info 级别日志
func Info(msg string, fields ...zap.Field) {
	GetLogger().Info(msg, fields...)
}

// Warn 输出 Warn 级别日志
func Warn(msg string, fields ...zap.Field) {
	GetLogger().Warn(msg, fields...)
}

// Error 输出 Error 级别日志
func Error(msg string, fields ...zap.Field) {
	GetLogger().Error(msg, fields...)
}

// Fatal 输出 Fatal 级别日志并退出程序
func Fatal(msg string, fields ...zap.Field) {
	GetLogger().Fatal(msg, fields...)
}

// With 创建带上下文字段的 logger
func With(fields ...zap.Field) *zap.Logger {
	return GetLogger().With(fields...)
}

// InitDefault 初始化默认 logger (用于测试)
func InitDefault() error {
	env := os.Getenv("APP_ENV")
	if env == "" {
		env = "development"
	}
	return Init(env)
}
