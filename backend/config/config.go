package config

import (
	"fmt"
	"os"
	"strings"

	"github.com/spf13/viper"
)

var envBindings = map[string][]string{
	"server.port":                  {"SERVER_PORT"},
	"server.mode":                  {"SERVER_MODE", "GIN_MODE"},
	"server.base_url":              {"SERVER_BASE_URL", "BASE_URL"},
	"server.frontend_url":          {"SERVER_FRONTEND_URL", "FRONTEND_URL"},
	"database.host":                {"DB_HOST", "DATABASE_HOST"},
	"database.port":                {"DB_PORT", "DATABASE_PORT"},
	"database.user":                {"DB_USER", "DATABASE_USER"},
	"database.password":            {"DB_PASSWORD", "DATABASE_PASSWORD"},
	"database.dbname":              {"DB_NAME", "DATABASE_NAME"},
	"database.sslmode":             {"DB_SSLMODE", "DATABASE_SSLMODE"},
	"redis.host":                   {"REDIS_HOST"},
	"redis.port":                   {"REDIS_PORT"},
	"redis.password":               {"REDIS_PASSWORD"},
	"redis.db":                     {"REDIS_DB"},
	"jwt.secret":                   {"JWT_SECRET"},
	"jwt.expiry":                   {"JWT_EXPIRY"},
	"storage.r2.account_id":        {"CLOUDFLARE_ACCOUNT_ID", "R2_ACCOUNT_ID"},
	"storage.r2.access_key_id":     {"CLOUDFLARE_ACCESS_KEY_ID", "R2_ACCESS_KEY_ID"},
	"storage.r2.secret_access_key": {"CLOUDFLARE_SECRET_ACCESS_KEY", "R2_SECRET_ACCESS_KEY"},
	"storage.r2.bucket":            {"R2_BUCKET"},
	"storage.r2.public_url":        {"R2_PUBLIC_URL"},
	"cache.l1_ttl":                 {"CACHE_L1_TTL"},
	"cache.l1_max_ttl":             {"CACHE_L1_MAX_TTL"},
	"cache.session_ttl":            {"CACHE_SESSION_TTL"},
	"cache.article_ttl":            {"CACHE_ARTICLE_TTL"},
	"timeout.database":             {"TIMEOUT_DATABASE"},
	"timeout.redis":                {"TIMEOUT_REDIS"},
	"timeout.upload":               {"TIMEOUT_UPLOAD"},
	"timeout.api":                  {"TIMEOUT_API"},
}

// Load loads configuration from file and environment variables
func Load(configPath string) (*Config, error) {
	v := viper.New()
	setDefaults(v)
	bindEnvironment(v)

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
		if configPath != "" {
			return nil, fmt.Errorf("failed to read config file: %w", err)
		}
		if _, ok := err.(viper.ConfigFileNotFoundError); !ok {
			return nil, fmt.Errorf("failed to read config file: %w", err)
		}
	}

	var cfg Config
	if err := v.Unmarshal(&cfg); err != nil {
		return nil, fmt.Errorf("failed to unmarshal config: %w", err)
	}

	// Validate configuration based on environment
	if err := Validate(&cfg); err != nil {
		return nil, fmt.Errorf("配置验证失败: %w", err)
	}

	return &cfg, nil
}

func setDefaults(v *viper.Viper) {
	v.SetDefault("server.port", "8080")
	v.SetDefault("server.mode", "development")
	v.SetDefault("server.base_url", "http://localhost:8080")
	v.SetDefault("server.frontend_url", "http://localhost:3000")
	v.SetDefault("database.host", "localhost")
	v.SetDefault("database.port", 5432)
	v.SetDefault("database.user", "tzblog")
	v.SetDefault("database.password", "tzblog")
	v.SetDefault("database.dbname", "tzblog_dev")
	v.SetDefault("database.sslmode", "disable")
	v.SetDefault("redis.host", "localhost")
	v.SetDefault("redis.port", 6379)
	v.SetDefault("redis.db", 0)
	v.SetDefault("jwt.expiry", "168h")
	v.SetDefault("cache.l1_ttl", 300)
	v.SetDefault("cache.l1_max_ttl", 600)
	v.SetDefault("cache.session_ttl", 1800)
	v.SetDefault("cache.article_ttl", 3600)
	v.SetDefault("timeout.database", 10)
	v.SetDefault("timeout.redis", 5)
	v.SetDefault("timeout.upload", 30)
	v.SetDefault("timeout.api", 30)
}

func bindEnvironment(v *viper.Viper) {
	v.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))
	v.AutomaticEnv()

	for key, envs := range envBindings {
		if err := v.BindEnv(append([]string{key}, envs...)...); err != nil {
			panic(fmt.Sprintf("failed to bind env for %s: %v", key, err))
		}
	}
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
