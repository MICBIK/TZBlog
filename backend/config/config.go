package config

import (
	"fmt"
	"os"

	"github.com/spf13/viper"
)

// Load loads configuration from file and environment variables
func Load(configPath string) (*Config, error) {
	v := viper.New()

	// Set config file path
	if configPath != "" {
		v.SetConfigFile(configPath)
	} else {
		v.SetConfigName("config")
		v.SetConfigType("yaml")
		v.AddConfigPath("./config")
		v.AddConfigPath(".")
	}

	// Read config file
	if err := v.ReadInConfig(); err != nil {
		return nil, fmt.Errorf("failed to read config file: %w", err)
	}

	// Allow environment variable overrides
	v.AutomaticEnv()

	var cfg Config
	if err := v.Unmarshal(&cfg); err != nil {
		return nil, fmt.Errorf("failed to unmarshal config: %w", err)
	}

	// ✅ SEC-003 FIX: Validate JWT secret strength
	if err := cfg.ValidateJWTSecret(); err != nil {
		return nil, err
	}

	return &cfg, nil
}

// ValidateJWTSecret validates JWT secret strength
func (c *Config) ValidateJWTSecret() error {
	secret := c.JWT.Secret
	if secret == "" {
		return fmt.Errorf("CRITICAL: JWT_SECRET must be set")
	}

	// Check for default/weak secrets
	weakSecrets := []string{
		"your-secret-key-change-in-production",
		"secret",
		"changeme",
		"password",
		"12345678",
	}

	for _, weak := range weakSecrets {
		if secret == weak {
			return fmt.Errorf("CRITICAL: JWT_SECRET must not be a default value (%s)", weak)
		}
	}

	// Enforce minimum length
	if len(secret) < 32 {
		return fmt.Errorf("CRITICAL: JWT_SECRET must be at least 32 characters (current: %d)", len(secret))
	}

	return nil
}

// GetRedisAddr returns Redis address
func (c *RedisConfig) GetRedisAddr() string {
	return fmt.Sprintf("%s:%d", c.Host, c.Port)
}

// IsDevelopment returns true if server is in development mode
func (c *Config) IsDevelopment() bool {
	return c.Server.Mode == "development" || c.Server.Mode == "dev"
}

// IsProduction returns true if server is in production mode
func (c *Config) IsProduction() bool {
	mode := c.Server.Mode
	if mode == "" {
		mode = os.Getenv("GIN_MODE")
	}
	return mode == "production" || mode == "release"
}
