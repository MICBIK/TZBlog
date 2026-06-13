package config

import (
	"fmt"
	"time"

	"github.com/spf13/viper"
)

// Config 应用配置
type Config struct {
	Server   ServerConfig   `mapstructure:"server"`
	Database DatabaseConfig `mapstructure:"database"`
	Redis    RedisConfig    `mapstructure:"redis"`
	JWT      JWTConfig      `mapstructure:"jwt"`
	Storage  StorageConfig  `mapstructure:"storage"`
	Log      LogConfig      `mapstructure:"log"`
}

// ServerConfig 服务器配置
type ServerConfig struct {
	Port string `mapstructure:"port"`
	Mode string `mapstructure:"mode"`
}

// DatabaseConfig 数据库配置
type DatabaseConfig struct {
	Host            string        `mapstructure:"host"`
	Port            int           `mapstructure:"port"`
	User            string        `mapstructure:"user"`
	Password        string        `mapstructure:"password"`
	DBName          string        `mapstructure:"dbname"`
	SSLMode         string        `mapstructure:"sslmode"`
	MaxIdleConns    int           `mapstructure:"max_idle_conns"`
	MaxOpenConns    int           `mapstructure:"max_open_conns"`
	ConnMaxLifetime time.Duration `mapstructure:"conn_max_lifetime"`
}

// RedisConfig Redis配置
type RedisConfig struct {
	Host     string `mapstructure:"host"`
	Port     int    `mapstructure:"port"`
	Password string `mapstructure:"password"`
	DB       int    `mapstructure:"db"`
	PoolSize int    `mapstructure:"pool_size"`
}

// JWTConfig JWT配置
type JWTConfig struct {
	Secret string        `mapstructure:"secret"`
	Expiry time.Duration `mapstructure:"expiry"`
}

// StorageConfig 存储配置
type StorageConfig struct {
	Provider string    `mapstructure:"provider"`
	R2       R2Config  `mapstructure:"r2"`
}

// R2Config Cloudflare R2配置
type R2Config struct {
	AccountID       string `mapstructure:"account_id"`
	AccessKeyID     string `mapstructure:"access_key_id"`
	SecretAccessKey string `mapstructure:"secret_access_key"`
	Bucket          string `mapstructure:"bucket"`
	PublicURL       string `mapstructure:"public_url"`
	Region          string `mapstructure:"region"`
}

// LogConfig 日志配置
type LogConfig struct {
	Level    string `mapstructure:"level"`
	Format   string `mapstructure:"format"`
	Output   string `mapstructure:"output"`
	FilePath string `mapstructure:"file_path"`
}

var cfg *Config

// Load 加载配置
func Load(configPath string) (*Config, error) {
	viper.SetConfigFile(configPath)
	viper.SetConfigType("yaml")

	// 环境变量支持
	viper.AutomaticEnv()
	viper.SetEnvPrefix("TZBLOG")

	// 读取配置文件
	if err := viper.ReadInConfig(); err != nil {
		return nil, fmt.Errorf("failed to read config file: %w", err)
	}

	// 解析配置
	var config Config
	if err := viper.Unmarshal(&config); err != nil {
		return nil, fmt.Errorf("failed to unmarshal config: %w", err)
	}

	// 环境变量覆盖
	if port := viper.GetString("PORT"); port != "" {
		config.Server.Port = port
	}
	if dbHost := viper.GetString("DB_HOST"); dbHost != "" {
		config.Database.Host = dbHost
	}
	if dbPort := viper.GetInt("DB_PORT"); dbPort != 0 {
		config.Database.Port = dbPort
	}
	if dbUser := viper.GetString("DB_USER"); dbUser != "" {
		config.Database.User = dbUser
	}
	if dbPass := viper.GetString("DB_PASSWORD"); dbPass != "" {
		config.Database.Password = dbPass
	}
	if dbName := viper.GetString("DB_NAME"); dbName != "" {
		config.Database.DBName = dbName
	}
	if redisHost := viper.GetString("REDIS_HOST"); redisHost != "" {
		config.Redis.Host = redisHost
	}
	if redisPort := viper.GetInt("REDIS_PORT"); redisPort != 0 {
		config.Redis.Port = redisPort
	}
	if jwtSecret := viper.GetString("JWT_SECRET"); jwtSecret != "" {
		config.JWT.Secret = jwtSecret
	}

	cfg = &config
	return cfg, nil
}

// Get 获取配置
func Get() *Config {
	return cfg
}

// GetDSN 获取数据库DSN
func (c *DatabaseConfig) GetDSN() string {
	return fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
		c.Host, c.Port, c.User, c.Password, c.DBName, c.SSLMode)
}

// GetAddr 获取Redis地址
func (c *RedisConfig) GetAddr() string {
	return fmt.Sprintf("%s:%d", c.Host, c.Port)
}
