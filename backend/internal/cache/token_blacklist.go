package cache

import (
	"context"
	"time"

	"github.com/redis/go-redis/v9"
)

// TokenBlacklist manages revoked JWT tokens using Redis
type TokenBlacklist struct {
	redis *redis.Client
}

// NewTokenBlacklist creates a new TokenBlacklist instance
func NewTokenBlacklist(redis *redis.Client) *TokenBlacklist {
	return &TokenBlacklist{redis: redis}
}

// Revoke adds a token ID to the blacklist with expiry
func (b *TokenBlacklist) Revoke(tokenID string, expiry time.Duration) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	return b.redis.Set(ctx, "revoked:"+tokenID, "1", expiry).Err()
}

// IsRevoked checks if a token ID is in the blacklist
func (b *TokenBlacklist) IsRevoked(tokenID string) bool {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	return b.redis.Exists(ctx, "revoked:"+tokenID).Val() > 0
}
