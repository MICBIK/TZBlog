package postgres

import (
	"time"

	"github.com/MICBIK/TZBlog/backend/internal/domain/apikey"
	"gorm.io/gorm"
)

// APIKeyRepository implements apikey.APIKeyRepository
type APIKeyRepository struct {
	db *gorm.DB
}

// NewAPIKeyRepository creates a new API key repository
func NewAPIKeyRepository(db *gorm.DB) apikey.APIKeyRepository {
	return &APIKeyRepository{db: db}
}

// Create creates a new API key
func (r *APIKeyRepository) Create(ak *apikey.APIKey) error {
	return r.db.Create(ak).Error
}

// GetByID retrieves an API key by ID
func (r *APIKeyRepository) GetByID(id int64) (*apikey.APIKey, error) {
	var ak apikey.APIKey
	err := r.db.First(&ak, id).Error
	if err != nil {
		return nil, err
	}
	return &ak, nil
}

// GetByKeyHash retrieves an API key by its hash
func (r *APIKeyRepository) GetByKeyHash(keyHash string) (*apikey.APIKey, error) {
	var ak apikey.APIKey
	err := r.db.Where("key_hash = ?", keyHash).First(&ak).Error
	if err != nil {
		return nil, err
	}
	return &ak, nil
}

// GetByUserID retrieves all API keys for a user
func (r *APIKeyRepository) GetByUserID(userID int64) ([]*apikey.APIKey, error) {
	var keys []*apikey.APIKey
	err := r.db.Where("user_id = ?", userID).
		Order("created_at DESC").
		Find(&keys).Error
	return keys, err
}

// Revoke revokes an API key
func (r *APIKeyRepository) Revoke(id int64, revokedAt time.Time) error {
	return r.db.Model(&apikey.APIKey{}).
		Where("id = ?", id).
		Updates(map[string]interface{}{
			"is_revoked": true,
			"revoked_at": revokedAt,
		}).Error
}

// Delete deletes an API key
func (r *APIKeyRepository) Delete(id int64) error {
	return r.db.Delete(&apikey.APIKey{}, id).Error
}

// UpdateLastUsed updates the last used timestamp
func (r *APIKeyRepository) UpdateLastUsed(id int64, lastUsedAt time.Time) error {
	return r.db.Model(&apikey.APIKey{}).
		Where("id = ?", id).
		Update("last_used_at", lastUsedAt).Error
}

// DeleteExpired deletes all expired API keys
func (r *APIKeyRepository) DeleteExpired() error {
	return r.db.Where("expires_at IS NOT NULL AND expires_at < ?", time.Now()).
		Delete(&apikey.APIKey{}).Error
}
