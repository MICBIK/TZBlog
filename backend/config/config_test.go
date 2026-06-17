package config

import (
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
)

// TestValidateJWTSecret tests JWT secret validation
func TestValidateJWTSecret(t *testing.T) {
	tests := []struct {
		name         string
		secret       string
		isProduction bool
		wantErr      bool
	}{
		{
			name:         "valid strong secret",
			secret:       "this-is-a-very-strong-secret-key-with-more-than-32-chars",
			isProduction: false,
			wantErr:      false,
		},
		{
			name:         "empty secret",
			secret:       "",
			isProduction: false,
			wantErr:      true,
		},
		{
			name:         "weak secret - default",
			secret:       "your-secret-key-change-in-production",
			isProduction: false,
			wantErr:      true,
		},
		{
			name:         "weak secret - common",
			secret:       "secret",
			isProduction: false,
			wantErr:      true,
		},
		{
			name:         "weak secret - changeme",
			secret:       "changeme",
			isProduction: false,
			wantErr:      true,
		},
		{
			name:         "weak secret - password",
			secret:       "password",
			isProduction: false,
			wantErr:      true,
		},
		{
			name:         "weak secret - numbers",
			secret:       "12345678",
			isProduction: false,
			wantErr:      true,
		},
		{
			name:         "secret too short",
			secret:       "short",
			isProduction: false,
			wantErr:      true,
		},
		{
			name:         "secret exactly 32 chars",
			secret:       "12345678901234567890123456789012",
			isProduction: false,
			wantErr:      false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateJWTSecret(tt.secret, tt.isProduction)
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

func TestLoad_EnvironmentOverridesNestedConfig(t *testing.T) {
	configFile := t.TempDir() + "/config.yaml"
	err := os.WriteFile(configFile, []byte(`
server:
  port: "8080"
  mode: development
  base_url: "http://localhost:8080"
  frontend_url: "http://localhost:3000"
database:
  host: localhost
  port: 5432
  user: tzblog
  password: tzblog
  dbname: tzblog_dev
  sslmode: disable
redis:
  host: localhost
  port: 6379
  password: ""
  db: 0
jwt:
  secret: "dev_secret_key_at_least_32_characters_long_12345"
  expiry: 168h
storage:
  r2:
    account_id: ""
    access_key_id: ""
    secret_access_key: ""
    bucket: ""
    public_url: ""
`), 0o600)
	assert.NoError(t, err)

	t.Setenv("SERVER_MODE", "production")
	t.Setenv("SERVER_BASE_URL", "https://api.example.com")
	t.Setenv("FRONTEND_URL", "https://example.com")
	t.Setenv("DB_HOST", "postgres")
	t.Setenv("DB_PASSWORD", "J8k2Np9xQm5Wz7vR3tYuB6nM4cX1aS0dF8hG2jK5")
	t.Setenv("DB_NAME", "tzblog_production")
	t.Setenv("DB_SSLMODE", "require")
	t.Setenv("REDIS_HOST", "redis")
	t.Setenv("REDIS_PASSWORD", "Kx9mP2nQ8wR5tY7uB3vC6aZ1sD4fG")
	t.Setenv("JWT_SECRET", "w8ImiQzHu+SCxqwkKpECVjXR12eSFfwfkF/2oBa5v0ph9ekUTDau1uqvAKxec04g")
	t.Setenv("CLOUDFLARE_ACCOUNT_ID", "account123")
	t.Setenv("CLOUDFLARE_ACCESS_KEY_ID", "key123")
	t.Setenv("CLOUDFLARE_SECRET_ACCESS_KEY", "secret123")
	t.Setenv("R2_BUCKET", "bucket123")
	t.Setenv("R2_PUBLIC_URL", "https://cdn.example.com")

	cfg, err := Load(configFile)
	assert.NoError(t, err)
	assert.Equal(t, "production", cfg.Server.Mode)
	assert.Equal(t, "https://api.example.com", cfg.Server.BaseURL)
	assert.Equal(t, "https://example.com", cfg.Server.FrontendURL)
	assert.Equal(t, "postgres", cfg.Database.Host)
	assert.Equal(t, "tzblog_production", cfg.Database.DBName)
	assert.Equal(t, "require", cfg.Database.SSLMode)
	assert.Equal(t, "redis", cfg.Redis.Host)
	assert.Equal(t, "account123", cfg.Storage.R2.AccountID)
}

func TestLoad_EnvironmentOnlyProductionConfig(t *testing.T) {
	t.Chdir(t.TempDir())
	t.Setenv("SERVER_MODE", "production")
	t.Setenv("SERVER_BASE_URL", "https://api.example.com")
	t.Setenv("DB_PASSWORD", "J8k2Np9xQm5Wz7vR3tYuB6nM4cX1aS0dF8hG2jK5")
	t.Setenv("DB_SSLMODE", "require")
	t.Setenv("REDIS_PASSWORD", "Kx9mP2nQ8wR5tY7uB3vC6aZ1sD4fG")
	t.Setenv("JWT_SECRET", "w8ImiQzHu+SCxqwkKpECVjXR12eSFfwfkF/2oBa5v0ph9ekUTDau1uqvAKxec04g")
	t.Setenv("CLOUDFLARE_ACCOUNT_ID", "account123")
	t.Setenv("CLOUDFLARE_ACCESS_KEY_ID", "key123")
	t.Setenv("CLOUDFLARE_SECRET_ACCESS_KEY", "secret123")
	t.Setenv("R2_BUCKET", "bucket123")
	t.Setenv("R2_PUBLIC_URL", "https://cdn.example.com")

	cfg, err := Load("")
	assert.NoError(t, err)
	assert.True(t, cfg.IsProduction())
	assert.Equal(t, "https://api.example.com", cfg.Server.BaseURL)
	assert.Equal(t, "require", cfg.Database.SSLMode)
}

// TestValidateProduction tests production environment validation
func TestValidateProduction(t *testing.T) {
	tests := []struct {
		name    string
		config  *Config
		wantErr bool
		errMsg  string
	}{
		{
			name: "valid production config",
			config: &Config{
				Server: ServerConfig{
					Mode:    "production",
					BaseURL: "https://api.example.com",
				},
				JWT: JWTConfig{
					Secret: "w8ImiQzHu+SCxqwkKpECVjXR12eSFfwfkF/2oBa5v0ph9ekUTDau1uqvAKxec04g",
				},
				Database: DatabaseConfig{
					Password: "J8k2Np9xQm5Wz7vR3tYuB6nM4cX1aS0dF8hG2jK5",
					SSLMode:  "require",
				},
				Redis: RedisConfig{
					Password: "Kx9mP2nQ8wR5tY7uB3vC6aZ1sD4fG",
				},
				Storage: StorageConfig{
					R2: R2Config{
						AccountID:       "account123",
						AccessKeyID:     "key123",
						SecretAccessKey: "secret123",
						Bucket:          "bucket123",
						PublicURL:       "https://cdn.example.com",
					},
				},
			},
			wantErr: false,
		},
		{
			name: "HTTP in production",
			config: &Config{
				Server: ServerConfig{
					Mode:    "production",
					BaseURL: "http://api.example.com",
				},
			},
			wantErr: true,
			errMsg:  "生产环境必须使用 HTTPS",
		},
		{
			name: "weak JWT secret",
			config: &Config{
				Server: ServerConfig{
					Mode:    "production",
					BaseURL: "https://api.example.com",
				},
				JWT: JWTConfig{
					Secret: "short",
				},
			},
			wantErr: true,
			errMsg:  "JWT_SECRET 长度必须至少 32 字符",
		},
		{
			name: "short database password",
			config: &Config{
				Server: ServerConfig{
					Mode:    "production",
					BaseURL: "https://api.example.com",
				},
				JWT: JWTConfig{
					Secret: "w8ImiQzHu+SCxqwkKpECVjXR12eSFfwfkF/2oBa5v0ph9ekUTDau1uqvAKxec04g",
				},
				Database: DatabaseConfig{
					Password: "password",
					SSLMode:  "require",
				},
				Redis: RedisConfig{
					Password: "Kx9mP2nQ8wR5tY7uB3vC6aZ1sD4fG",
				},
			},
			wantErr: true,
			errMsg:  "数据库密码长度必须至少 32 字符",
		},
		{
			name: "empty Redis password",
			config: &Config{
				Server: ServerConfig{
					Mode:    "production",
					BaseURL: "https://api.example.com",
				},
				JWT: JWTConfig{
					Secret: "w8ImiQzHu+SCxqwkKpECVjXR12eSFfwfkF/2oBa5v0ph9ekUTDau1uqvAKxec04g",
				},
				Database: DatabaseConfig{
					Password: "J8k2Np9xQm5Wz7vR3tYuB6nM4cX1aS0dF8hG2jK5",
					SSLMode:  "require",
				},
				Redis: RedisConfig{
					Password: "",
				},
			},
			wantErr: true,
			errMsg:  "生产环境必须设置 Redis 密码",
		},
		{
			name: "database SSL disabled",
			config: &Config{
				Server: ServerConfig{
					Mode:    "production",
					BaseURL: "https://api.example.com",
				},
				JWT: JWTConfig{
					Secret: "w8ImiQzHu+SCxqwkKpECVjXR12eSFfwfkF/2oBa5v0ph9ekUTDau1uqvAKxec04g",
				},
				Database: DatabaseConfig{
					Password: "J8k2Np9xQm5Wz7vR3tYuB6nM4cX1aS0dF8hG2jK5",
					SSLMode:  "disable",
				},
				Redis: RedisConfig{
					Password: "Kx9mP2nQ8wR5tY7uB3vC6aZ1sD4fG",
				},
			},
			wantErr: true,
			errMsg:  "生产环境必须启用数据库 SSL",
		},
		{
			name: "missing R2 configuration",
			config: &Config{
				Server: ServerConfig{
					Mode:    "production",
					BaseURL: "https://api.example.com",
				},
				JWT: JWTConfig{
					Secret: "w8ImiQzHu+SCxqwkKpECVjXR12eSFfwfkF/2oBa5v0ph9ekUTDau1uqvAKxec04g",
				},
				Database: DatabaseConfig{
					Password: "J8k2Np9xQm5Wz7vR3tYuB6nM4cX1aS0dF8hG2jK5",
					SSLMode:  "require",
				},
				Redis: RedisConfig{
					Password: "Kx9mP2nQ8wR5tY7uB3vC6aZ1sD4fG",
				},
				Storage: StorageConfig{
					R2: R2Config{
						AccessKeyID: "your_access_key_id_here",
					},
				},
			},
			wantErr: true,
			errMsg:  "生产环境必须配置",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateProduction(tt.config)
			if tt.wantErr {
				assert.Error(t, err)
				assert.Contains(t, err.Error(), tt.errMsg)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

// TestValidatePasswordStrength tests password strength validation
func TestValidatePasswordStrength(t *testing.T) {
	tests := []struct {
		name         string
		password     string
		minLength    int
		isProduction bool
		fieldName    string
		wantErr      bool
		errMsg       string
	}{
		{
			name:         "valid strong password",
			password:     "J8k2Np9xQm5Wz7vR3tYuB6nM4cX1aS0dF8hG2jK5",
			minLength:    32,
			isProduction: true,
			fieldName:    "测试密码",
			wantErr:      false,
		},
		{
			name:         "empty password",
			password:     "",
			minLength:    32,
			isProduction: true,
			fieldName:    "测试密码",
			wantErr:      true,
			errMsg:       "测试密码不能为空",
		},
		{
			name:         "password too short",
			password:     "short",
			minLength:    32,
			isProduction: true,
			fieldName:    "测试密码",
			wantErr:      true,
			errMsg:       "测试密码长度必须至少 32 字符",
		},
		{
			name:         "weak password - password",
			password:     "password",
			minLength:    1,
			isProduction: true,
			fieldName:    "测试密码",
			wantErr:      true,
			errMsg:       "测试密码不能使用常见弱密码",
		},
		{
			name:         "weak password - admin",
			password:     "admin",
			minLength:    1,
			isProduction: true,
			fieldName:    "测试密码",
			wantErr:      true,
			errMsg:       "测试密码不能使用常见弱密码",
		},
		{
			name:         "low entropy password in production",
			password:     "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
			minLength:    32,
			isProduction: true,
			fieldName:    "测试密码",
			wantErr:      true,
			errMsg:       "测试密码熵过低",
		},
		{
			name:         "low entropy password in development",
			password:     "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
			minLength:    32,
			isProduction: false,
			fieldName:    "测试密码",
			wantErr:      false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidatePasswordStrength(tt.password, tt.minLength, tt.isProduction, tt.fieldName)
			if tt.wantErr {
				assert.Error(t, err)
				assert.Contains(t, err.Error(), tt.errMsg)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

// TestCalculateEntropy tests entropy calculation
func TestCalculateEntropy(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		minValue float64
		maxValue float64
	}{
		{
			name:     "empty string",
			input:    "",
			minValue: 0.0,
			maxValue: 0.0,
		},
		{
			name:     "low entropy - all same character",
			input:    "aaaaaaaaaa",
			minValue: 0.0,
			maxValue: 0.1,
		},
		{
			name:     "low entropy - simple pattern",
			input:    "abcabcabc",
			minValue: 1.5,
			maxValue: 2.0,
		},
		{
			name:     "medium entropy - password",
			input:    "password123",
			minValue: 2.5,
			maxValue: 3.5,
		},
		{
			name:     "high entropy - random",
			input:    "J8k2Np9xQm5W",
			minValue: 3.5,
			maxValue: 5.0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := calculateEntropy(tt.input)
			assert.GreaterOrEqual(t, result, tt.minValue)
			assert.LessOrEqual(t, result, tt.maxValue)
		})
	}
}

// TestIsWeakPassword tests weak password detection
func TestIsWeakPassword(t *testing.T) {
	tests := []struct {
		name     string
		password string
		want     bool
	}{
		{
			name:     "strong random password",
			password: "J8k2Np9xQm5Wz7vR3tYuB6nM",
			want:     false,
		},
		{
			name:     "weak - password",
			password: "password",
			want:     true,
		},
		{
			name:     "weak - password123",
			password: "password123",
			want:     true,
		},
		{
			name:     "weak - admin",
			password: "admin",
			want:     true,
		},
		{
			name:     "weak - admin123",
			password: "admin123",
			want:     true,
		},
		{
			name:     "weak - postgres",
			password: "postgres",
			want:     true,
		},
		{
			name:     "weak - tzblog",
			password: "tzblog",
			want:     true,
		},
		{
			name:     "weak - 12345678",
			password: "12345678",
			want:     true,
		},
		{
			name:     "strong - contains weak substring",
			password: "mypassword2024",
			want:     false,
		},
		{
			name:     "weak - uppercase password",
			password: "PASSWORD",
			want:     true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := isWeakPassword(tt.password)
			assert.Equal(t, tt.want, result)
		})
	}
}

// TestValidateHTTPS tests HTTPS validation
func TestValidateHTTPS(t *testing.T) {
	tests := []struct {
		name    string
		url     string
		wantErr bool
	}{
		{
			name:    "valid HTTPS",
			url:     "https://api.example.com",
			wantErr: false,
		},
		{
			name:    "invalid HTTP",
			url:     "http://api.example.com",
			wantErr: true,
		},
		{
			name:    "invalid no protocol",
			url:     "api.example.com",
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateHTTPS(tt.url)
			if tt.wantErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

// TestValidateR2Config tests R2 configuration validation
func TestValidateR2Config(t *testing.T) {
	tests := []struct {
		name         string
		config       *R2Config
		isProduction bool
		wantErr      bool
		errMsg       string
	}{
		{
			name: "valid production config",
			config: &R2Config{
				AccountID:       "account123",
				AccessKeyID:     "key123",
				SecretAccessKey: "secret123",
				Bucket:          "bucket123",
				PublicURL:       "https://cdn.example.com",
			},
			isProduction: true,
			wantErr:      false,
		},
		{
			name:         "optional in development",
			config:       &R2Config{},
			isProduction: false,
			wantErr:      false,
		},
		{
			name: "missing account ID",
			config: &R2Config{
				AccessKeyID:     "key123",
				SecretAccessKey: "secret123",
				Bucket:          "bucket123",
				PublicURL:       "https://cdn.example.com",
			},
			isProduction: true,
			wantErr:      true,
			errMsg:       "生产环境必须配置 CLOUDFLARE_ACCOUNT_ID",
		},
		{
			name: "template access key",
			config: &R2Config{
				AccountID:       "account123",
				AccessKeyID:     "your_access_key_id_here",
				SecretAccessKey: "secret123",
				Bucket:          "bucket123",
				PublicURL:       "https://cdn.example.com",
			},
			isProduction: true,
			wantErr:      true,
			errMsg:       "生产环境必须配置 CLOUDFLARE_ACCESS_KEY_ID",
		},
		{
			name: "template secret key",
			config: &R2Config{
				AccountID:       "account123",
				AccessKeyID:     "key123",
				SecretAccessKey: "your_secret_access_key_here",
				Bucket:          "bucket123",
				PublicURL:       "https://cdn.example.com",
			},
			isProduction: true,
			wantErr:      true,
			errMsg:       "生产环境必须配置 CLOUDFLARE_SECRET_ACCESS_KEY",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateR2Config(tt.config, tt.isProduction)
			if tt.wantErr {
				assert.Error(t, err)
				assert.Contains(t, err.Error(), tt.errMsg)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}
