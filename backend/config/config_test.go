package config

import (
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
)

// TestConfig_ValidateJWTSecret tests JWT secret validation
func TestConfig_ValidateJWTSecret(t *testing.T) {
	tests := []struct {
		name    string
		secret  string
		wantErr bool
	}{
		{
			name:    "valid strong secret",
			secret:  "this-is-a-very-strong-secret-key-with-more-than-32-chars",
			wantErr: false,
		},
		{
			name:    "empty secret",
			secret:  "",
			wantErr: true,
		},
		{
			name:    "weak secret - default",
			secret:  "your-secret-key-change-in-production",
			wantErr: true,
		},
		{
			name:    "weak secret - common",
			secret:  "secret",
			wantErr: true,
		},
		{
			name:    "weak secret - changeme",
			secret:  "changeme",
			wantErr: true,
		},
		{
			name:    "weak secret - password",
			secret:  "password",
			wantErr: true,
		},
		{
			name:    "weak secret - numbers",
			secret:  "12345678",
			wantErr: true,
		},
		{
			name:    "secret too short",
			secret:  "short",
			wantErr: true,
		},
		{
			name:    "secret exactly 32 chars",
			secret:  "12345678901234567890123456789012",
			wantErr: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			cfg := &Config{
				JWT: JWTConfig{
					Secret: tt.secret,
				},
			}

			err := cfg.ValidateJWTSecret()
			if tt.wantErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

// TestRedisConfig_GetRedisAddr tests Redis address generation
func TestRedisConfig_GetRedisAddr(t *testing.T) {
	tests := []struct {
		name     string
		config   *RedisConfig
		expected string
	}{
		{
			name: "default port",
			config: &RedisConfig{
				Host: "localhost",
				Port: 6379,
			},
			expected: "localhost:6379",
		},
		{
			name: "custom port",
			config: &RedisConfig{
				Host: "redis.example.com",
				Port: 6380,
			},
			expected: "redis.example.com:6380",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := tt.config.GetRedisAddr()
			assert.Equal(t, tt.expected, result)
		})
	}
}

// TestConfig_IsDevelopment tests development mode check
func TestConfig_IsDevelopment(t *testing.T) {
	tests := []struct {
		name string
		mode string
		want bool
	}{
		{
			name: "development mode",
			mode: "development",
			want: true,
		},
		{
			name: "dev mode",
			mode: "dev",
			want: true,
		},
		{
			name: "production mode",
			mode: "production",
			want: false,
		},
		{
			name: "release mode",
			mode: "release",
			want: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			cfg := &Config{
				Server: ServerConfig{
					Mode: tt.mode,
				},
			}

			result := cfg.IsDevelopment()
			assert.Equal(t, tt.want, result)
		})
	}
}

// TestConfig_IsProduction tests production mode check
func TestConfig_IsProduction(t *testing.T) {
	tests := []struct {
		name    string
		mode    string
		envMode string
		want    bool
	}{
		{
			name: "production mode",
			mode: "production",
			want: true,
		},
		{
			name: "release mode",
			mode: "release",
			want: true,
		},
		{
			name: "development mode",
			mode: "development",
			want: false,
		},
		{
			name:    "empty mode with production env",
			mode:    "",
			envMode: "production",
			want:    true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.envMode != "" {
				os.Setenv("GIN_MODE", tt.envMode)
				defer os.Unsetenv("GIN_MODE")
			}

			cfg := &Config{
				Server: ServerConfig{
					Mode: tt.mode,
				},
			}

			result := cfg.IsProduction()
			assert.Equal(t, tt.want, result)
		})
	}
}
