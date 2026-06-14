package config

import (
	"context"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

// ValidateRedisConfig validates Redis configuration
// Fixes C-009: Redis password validation
func ValidateRedisConfig(cfg *RedisConfig, isProduction bool) error {
	if isProduction {
		if cfg.Password == "" {
			return fmt.Errorf("REDIS_PASSWORD required in production")
		}
		if len(cfg.Password) < 16 {
			return fmt.Errorf("REDIS_PASSWORD must be ≥16 characters in production (current: %d)", len(cfg.Password))
		}
	}
	return nil
}

// NewRedisClient creates a new Redis client
func NewRedisClient(cfg *RedisConfig) (*redis.Client, error) {
	client := redis.NewClient(&redis.Options{
		Addr:     fmt.Sprintf("%s:%d", cfg.Host, cfg.Port),
		Password: cfg.Password,
		DB:       cfg.DB,
		PoolSize: 10,
	})

	// Test connection
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := client.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("failed to connect to Redis: %w", err)
	}

	return client, nil
}
