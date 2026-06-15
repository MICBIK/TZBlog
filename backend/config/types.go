package config

// Config represents application configuration
type Config struct {
	Server   ServerConfig   `yaml:"server"`
	Database DatabaseConfig `yaml:"database"`
	Redis    RedisConfig    `yaml:"redis"`
	JWT      JWTConfig      `yaml:"jwt"`
	Storage  StorageConfig  `yaml:"storage"`
	Cache    CacheConfig    `yaml:"cache"`
	Timeout  TimeoutConfig  `yaml:"timeout"`
}

// ServerConfig represents server configuration
type ServerConfig struct {
	Port        string `yaml:"port"`
	Mode        string `yaml:"mode"`
	BaseURL     string `yaml:"base_url"`
	FrontendURL string `yaml:"frontend_url"`
}

// DatabaseConfig represents database configuration
type DatabaseConfig struct {
	Host     string `yaml:"host"`
	Port     int    `yaml:"port"`
	User     string `yaml:"user"`
	Password string `yaml:"password"`
	DBName   string `yaml:"dbname"`
	SSLMode  string `yaml:"sslmode"`
}

// RedisConfig represents Redis configuration
type RedisConfig struct {
	Host     string `yaml:"host"`
	Port     int    `yaml:"port"`
	Password string `yaml:"password"`
	DB       int    `yaml:"db"`
}

// JWTConfig represents JWT configuration
type JWTConfig struct {
	Secret string `yaml:"secret"`
	Expiry string `yaml:"expiry"`
}

// StorageConfig represents storage configuration
type StorageConfig struct {
	R2 R2Config `yaml:"r2"`
}

// R2Config represents Cloudflare R2 configuration
type R2Config struct {
	AccountID       string `yaml:"account_id"`
	AccessKeyID     string `yaml:"access_key_id"`
	SecretAccessKey string `yaml:"secret_access_key"`
	Bucket          string `yaml:"bucket"`
	PublicURL       string `yaml:"public_url"`
}

// CacheConfig represents cache configuration
type CacheConfig struct {
	L1TTL      int `yaml:"l1_ttl" default:"300"`       // L1 cache TTL in seconds (5 minutes)
	L1MaxTTL   int `yaml:"l1_max_ttl" default:"600"`   // L1 cache max TTL in seconds (10 minutes)
	SessionTTL int `yaml:"session_ttl" default:"1800"` // Session TTL in seconds (30 minutes)
	ArticleTTL int `yaml:"article_ttl" default:"3600"` // Article cache TTL in seconds (1 hour)
}

// TimeoutConfig represents timeout configuration
type TimeoutConfig struct {
	Database int `yaml:"database" default:"10"` // Database operation timeout in seconds
	Redis    int `yaml:"redis" default:"5"`     // Redis operation timeout in seconds
	Upload   int `yaml:"upload" default:"30"`   // Upload operation timeout in seconds
	API      int `yaml:"api" default:"30"`      // API request timeout in seconds
}
