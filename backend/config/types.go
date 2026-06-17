package config

// Config represents application configuration
type Config struct {
	Server   ServerConfig   `yaml:"server" mapstructure:"server"`
	Database DatabaseConfig `yaml:"database" mapstructure:"database"`
	Redis    RedisConfig    `yaml:"redis" mapstructure:"redis"`
	JWT      JWTConfig      `yaml:"jwt" mapstructure:"jwt"`
	Storage  StorageConfig  `yaml:"storage" mapstructure:"storage"`
	Cache    CacheConfig    `yaml:"cache" mapstructure:"cache"`
	Timeout  TimeoutConfig  `yaml:"timeout" mapstructure:"timeout"`
}

// ServerConfig represents server configuration
type ServerConfig struct {
	Port        string `yaml:"port" mapstructure:"port"`
	Mode        string `yaml:"mode" mapstructure:"mode"`
	BaseURL     string `yaml:"base_url" mapstructure:"base_url"`
	FrontendURL string `yaml:"frontend_url" mapstructure:"frontend_url"`
}

// DatabaseConfig represents database configuration
type DatabaseConfig struct {
	Host     string `yaml:"host" mapstructure:"host"`
	Port     int    `yaml:"port" mapstructure:"port"`
	User     string `yaml:"user" mapstructure:"user"`
	Password string `yaml:"password" mapstructure:"password"`
	DBName   string `yaml:"dbname" mapstructure:"dbname"`
	SSLMode  string `yaml:"sslmode" mapstructure:"sslmode"`
}

// RedisConfig represents Redis configuration
type RedisConfig struct {
	Host     string `yaml:"host" mapstructure:"host"`
	Port     int    `yaml:"port" mapstructure:"port"`
	Password string `yaml:"password" mapstructure:"password"`
	DB       int    `yaml:"db" mapstructure:"db"`
}

// JWTConfig represents JWT configuration
type JWTConfig struct {
	Secret string `yaml:"secret" mapstructure:"secret"`
	Expiry string `yaml:"expiry" mapstructure:"expiry"`
}

// StorageConfig represents storage configuration
type StorageConfig struct {
	R2 R2Config `yaml:"r2" mapstructure:"r2"`
}

// R2Config represents Cloudflare R2 configuration
type R2Config struct {
	AccountID       string `yaml:"account_id" mapstructure:"account_id"`
	AccessKeyID     string `yaml:"access_key_id" mapstructure:"access_key_id"`
	SecretAccessKey string `yaml:"secret_access_key" mapstructure:"secret_access_key"`
	Bucket          string `yaml:"bucket" mapstructure:"bucket"`
	PublicURL       string `yaml:"public_url" mapstructure:"public_url"`
}

// CacheConfig represents cache configuration
type CacheConfig struct {
	L1TTL      int `yaml:"l1_ttl" mapstructure:"l1_ttl" default:"300"`            // L1 cache TTL in seconds (5 minutes)
	L1MaxTTL   int `yaml:"l1_max_ttl" mapstructure:"l1_max_ttl" default:"600"`    // L1 cache max TTL in seconds (10 minutes)
	SessionTTL int `yaml:"session_ttl" mapstructure:"session_ttl" default:"1800"` // Session TTL in seconds (30 minutes)
	ArticleTTL int `yaml:"article_ttl" mapstructure:"article_ttl" default:"3600"` // Article cache TTL in seconds (1 hour)
}

// TimeoutConfig represents timeout configuration
type TimeoutConfig struct {
	Database int `yaml:"database" mapstructure:"database" default:"10"` // Database operation timeout in seconds
	Redis    int `yaml:"redis" mapstructure:"redis" default:"5"`        // Redis operation timeout in seconds
	Upload   int `yaml:"upload" mapstructure:"upload" default:"30"`     // Upload operation timeout in seconds
	API      int `yaml:"api" mapstructure:"api" default:"30"`           // API request timeout in seconds
}
