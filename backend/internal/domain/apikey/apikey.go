package apikey

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"time"
)

// APIKey represents an API key entity
type APIKey struct {
	ID          int64      `json:"id" gorm:"primaryKey"`
	UserID      int64      `json:"userId" gorm:"not null;index"`
	Name        string     `json:"name" gorm:"type:varchar(100);not null"`
	Key         string     `json:"key,omitempty" gorm:"-"` // 只在创建时返回，不存储
	KeyPrefix   string     `json:"keyPrefix" gorm:"type:varchar(8);not null;index"`
	KeyHash     string     `json:"-" gorm:"type:varchar(64);not null;uniqueIndex"`
	Permissions []string   `json:"permissions" gorm:"type:text"`
	IsRevoked   bool       `json:"isRevoked" gorm:"default:false"`
	RevokedAt   *time.Time `json:"revokedAt,omitempty"`
	ExpiresAt   *time.Time `json:"expiresAt,omitempty"`
	LastUsedAt  *time.Time `json:"lastUsedAt,omitempty"`
	CreatedAt   time.Time  `json:"createdAt" gorm:"autoCreateTime"`
	UpdatedAt   time.Time  `json:"updatedAt" gorm:"autoUpdateTime"`
}

// TableName returns the table name
func (APIKey) TableName() string {
	return "api_keys"
}

// IsActive checks if the API key is active
func (a *APIKey) IsActive() bool {
	if a.IsRevoked {
		return false
	}
	if a.IsExpired() {
		return false
	}
	return true
}

// IsExpired checks if the API key has expired
func (a *APIKey) IsExpired() bool {
	if a.ExpiresAt == nil {
		return false
	}
	return time.Now().After(*a.ExpiresAt)
}

// APIKeyRepository defines the interface for API key operations
type APIKeyRepository interface {
	Create(apiKey *APIKey) error
	GetByID(id int64) (*APIKey, error)
	GetByKeyHash(keyHash string) (*APIKey, error)
	GetByUserID(userID int64) ([]*APIKey, error)
	Revoke(id int64, revokedAt time.Time) error
	Delete(id int64) error
	UpdateLastUsed(id int64, lastUsedAt time.Time) error
	DeleteExpired() error
}

// GenerateAPIKey generates a new API key with cryptographically secure random bytes
func GenerateAPIKey() (string, error) {
	// 生成 32 字节的随机数据
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}

	// 使用 base64 编码，添加前缀以标识为 API key
	key := "tzb_" + base64.URLEncoding.EncodeToString(bytes)
	return key, nil
}

// GetKeyPrefix extracts the prefix from an API key for display
func GetKeyPrefix(key string) string {
	if len(key) < 8 {
		return key
	}
	return key[:8]
}

// HashKey creates a SHA-256 hash of the API key
func HashKey(key string) string {
	h := sha256.Sum256([]byte(key))
	return hex.EncodeToString(h[:])
}
