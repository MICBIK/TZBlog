package apikey

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestGenerateAPIKey(t *testing.T) {
	key1, err := GenerateAPIKey()
	require.NoError(t, err)
	assert.NotEmpty(t, key1)
	assert.Contains(t, key1, "tzb_")

	// 测试唯一性
	key2, err := GenerateAPIKey()
	require.NoError(t, err)
	assert.NotEqual(t, key1, key2)
}

func TestGetKeyPrefix(t *testing.T) {
	tests := []struct {
		name     string
		key      string
		expected string
	}{
		{"normal key", "tzb_abcdefghijk", "tzb_abcd"},
		{"short key", "abc", "abc"},
		{"exactly 8 chars", "12345678", "12345678"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := GetKeyPrefix(tt.key)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestHashKey(t *testing.T) {
	key := "test_key_123"
	hash1 := HashKey(key)
	hash2 := HashKey(key)

	assert.NotEmpty(t, hash1)
	assert.Equal(t, hash1, hash2, "same key should produce same hash")
	assert.Len(t, hash1, 64, "SHA-256 hash should be 64 hex characters")

	// 不同的 key 应该产生不同的 hash
	hash3 := HashKey("different_key")
	assert.NotEqual(t, hash1, hash3)
}

func TestAPIKey_IsActive(t *testing.T) {
	now := time.Now()
	future := now.Add(24 * time.Hour)
	past := now.Add(-24 * time.Hour)

	tests := []struct {
		name     string
		apiKey   *APIKey
		expected bool
	}{
		{
			name: "active key",
			apiKey: &APIKey{
				IsRevoked: false,
				ExpiresAt: &future,
			},
			expected: true,
		},
		{
			name: "revoked key",
			apiKey: &APIKey{
				IsRevoked: true,
				ExpiresAt: &future,
			},
			expected: false,
		},
		{
			name: "expired key",
			apiKey: &APIKey{
				IsRevoked: false,
				ExpiresAt: &past,
			},
			expected: false,
		},
		{
			name: "no expiration",
			apiKey: &APIKey{
				IsRevoked: false,
				ExpiresAt: nil,
			},
			expected: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := tt.apiKey.IsActive()
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestAPIKey_IsExpired(t *testing.T) {
	now := time.Now()
	future := now.Add(24 * time.Hour)
	past := now.Add(-24 * time.Hour)

	tests := []struct {
		name     string
		apiKey   *APIKey
		expected bool
	}{
		{
			name: "not expired",
			apiKey: &APIKey{
				ExpiresAt: &future,
			},
			expected: false,
		},
		{
			name: "expired",
			apiKey: &APIKey{
				ExpiresAt: &past,
			},
			expected: true,
		},
		{
			name: "no expiration",
			apiKey: &APIKey{
				ExpiresAt: nil,
			},
			expected: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := tt.apiKey.IsExpired()
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestAPIKey_TableName(t *testing.T) {
	apiKey := &APIKey{}
	assert.Equal(t, "api_keys", apiKey.TableName())
}
