package logger

import (
	"os"
	"testing"

	"go.uber.org/zap"
)

func TestInit(t *testing.T) {
	tests := []struct {
		name    string
		env     string
		wantErr bool
	}{
		{
			name:    "development environment",
			env:     "development",
			wantErr: false,
		},
		{
			name:    "production environment",
			env:     "production",
			wantErr: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := Init(tt.env)
			if (err != nil) != tt.wantErr {
				t.Errorf("Init() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestGetLogger(t *testing.T) {
	// Reset global logger
	globalLogger = nil

	logger := GetLogger()
	if logger == nil {
		t.Error("GetLogger() returned nil")
	}
}

func TestLoggingFunctions(t *testing.T) {
	// Initialize logger for testing
	err := Init("development")
	if err != nil {
		t.Fatalf("Failed to initialize logger: %v", err)
	}

	// Test all logging functions
	Debug("debug message", zap.String("key", "value"))
	Info("info message", zap.String("key", "value"))
	Warn("warn message", zap.String("key", "value"))
	Error("error message", zap.String("key", "value"))

	// Test With function
	contextLogger := With(zap.String("request_id", "123"))
	if contextLogger == nil {
		t.Error("With() returned nil")
	}
}

func TestInitDefault(t *testing.T) {
	// Set environment variable
	os.Setenv("APP_ENV", "production")
	defer os.Unsetenv("APP_ENV")

	err := InitDefault()
	if err != nil {
		t.Errorf("InitDefault() error = %v", err)
	}
}

func TestSync(t *testing.T) {
	// Initialize logger
	err := Init("development")
	if err != nil {
		t.Fatalf("Failed to initialize logger: %v", err)
	}

	// Test sync - ignore "bad file descriptor" error in test environment
	err = Sync()
	if err != nil && err.Error() != "sync /dev/stderr: bad file descriptor" {
		t.Errorf("Sync() unexpected error = %v", err)
	}
}
