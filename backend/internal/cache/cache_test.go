package cache

import (
	"context"
	"testing"
	"time"

	"github.com/go-redis/redismock/v9"
	"github.com/stretchr/testify/assert"
)

func TestArticleCache_DeleteArticle(t *testing.T) {
	client, mock := redismock.NewClientMock()
	cache := NewArticleCache(client, 5*time.Second, 1*time.Hour)

	// Mock Delete
	mock.ExpectDel("tzblog:article:test-article").SetVal(1)

	err := cache.DeleteArticle("test-article")
	assert.NoError(t, err)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestTokenBlacklist_Revoke(t *testing.T) {
	client, mock := redismock.NewClientMock()
	blacklist := NewTokenBlacklist(client)

	// Mock Set with expiry
	mock.ExpectSet("revoked:test-jti", "1", 1*time.Hour).SetVal("OK")

	err := blacklist.Revoke("test-jti", 1*time.Hour)
	assert.NoError(t, err)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestTokenBlacklist_IsRevoked_True(t *testing.T) {
	client, mock := redismock.NewClientMock()
	blacklist := NewTokenBlacklist(client)

	// Mock Exists returning 1 (exists)
	mock.ExpectExists("revoked:test-jti").SetVal(1)

	revoked := blacklist.IsRevoked("test-jti")
	assert.True(t, revoked)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestTokenBlacklist_IsRevoked_False(t *testing.T) {
	client, mock := redismock.NewClientMock()
	blacklist := NewTokenBlacklist(client)

	// Mock Exists returning 0 (does not exist)
	mock.ExpectExists("revoked:test-jti").SetVal(0)

	revoked := blacklist.IsRevoked("test-jti")
	assert.False(t, revoked)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestCacheKey(t *testing.T) {
	tests := []struct {
		name     string
		prefix   string
		key      interface{}
		expected string
	}{
		{
			name:     "article key",
			prefix:   PrefixArticle,
			key:      "test-slug",
			expected: "tzblog:article:test-slug",
		},
		{
			name:     "view count key",
			prefix:   PrefixViewCount,
			key:      123,
			expected: "tzblog:view_count:123",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := CacheKey(tt.prefix, tt.key)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestStrategy_Delete(t *testing.T) {
	client, mock := redismock.NewClientMock()
	strategy := NewStrategy(client)

	ctx := context.Background()

	mock.ExpectDel("test:key").SetVal(1)

	err := strategy.Delete(ctx, "test:key")
	assert.NoError(t, err)
	assert.NoError(t, mock.ExpectationsWereMet())
}
