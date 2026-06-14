package config

// Config represents application configuration
type Config struct {
	Server   ServerConfig   `yaml:"server"`
	Database DatabaseConfig `yaml:"database"`
	Redis    RedisConfig    `yaml:"redis"`
	JWT      JWTConfig      `yaml:"jwt"`
	Storage  StorageConfig  `yaml:"storage"`
}

// ServerConfig represents server configuration
type ServerConfig struct {
	Port    string `yaml:"port"`
	Mode    string `yaml:"mode"`
	BaseURL string `yaml:"base_url"`
}

// DatabaseConfig represents database configuration
type DatabaseConfig struct {
	Host     string `yaml:"host"`
	Port     int    `yaml:"port"`
	User     string `yaml:"user"`
	Password string `yaml:"password"`
	DBName   string `yaml:"dbname"`
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

// Load loads configuration from file
func Load(configPath string) (*Config, error) {
	// Implementation in config.go
	return nil, nil
}
