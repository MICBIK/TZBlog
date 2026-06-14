package apikey

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"time"

	"github.com/MICBIK/TZBlog/backend/internal/domain/apikey"
)

// Manager API密钥管理器
type Manager struct {
	repo apikey.APIKeyRepository
}

// NewManager 创建API密钥管理器
func NewManager(repo apikey.APIKeyRepository) *Manager {
	return &Manager{repo: repo}
}

// CreateAPIKey 创建API密钥
func (m *Manager) CreateAPIKey(userID int64, name string, permissions []string, expiresAt *time.Time) (*apikey.APIKey, error) {
	// 生成API密钥
	key, err := apikey.GenerateAPIKey()
	if err != nil {
		return nil, fmt.Errorf("failed to generate API key: %w", err)
	}

	// 计算密钥哈希
	keyHash := HashAPIKey(key)

	// 创建API密钥对象
	apikeyObj := &apikey.APIKey{
		UserID:      userID,
		Name:        name,
		Key:         key,
		KeyPrefix:   apikey.GetKeyPrefix(key),
		KeyHash:     keyHash,
		Permissions: permissions,
		ExpiresAt:   expiresAt,
		CreatedAt:   time.Now(),
	}

	// 保存到数据库
	if err := m.repo.Create(apikeyObj); err != nil {
		return nil, fmt.Errorf("failed to create API key: %w", err)
	}

	return apikeyObj, nil
}

// ValidateAPIKey 验证API密钥
func (m *Manager) ValidateAPIKey(key string) (*apikey.APIKey, error) {
	// 计算密钥哈希
	keyHash := HashAPIKey(key)

	// 查询API密钥
	apikeyObj, err := m.repo.GetByKeyHash(keyHash)
	if err != nil {
		return nil, fmt.Errorf("invalid API key")
	}

	// 检查密钥是否有效
	if !apikeyObj.IsActive() {
		if apikeyObj.IsRevoked {
			return nil, fmt.Errorf("API key has been revoked")
		}
		if apikeyObj.IsExpired() {
			return nil, fmt.Errorf("API key has expired")
		}
	}

	// 更新最后使用时间
	now := time.Now()
	if err := m.repo.UpdateLastUsed(apikeyObj.ID, now); err != nil {
		// 记录错误但不影响验证结果
		fmt.Printf("Failed to update last used time: %v\n", err)
	}

	return apikeyObj, nil
}

// RevokeAPIKey 撤销API密钥
func (m *Manager) RevokeAPIKey(id int64) error {
	return m.repo.Revoke(id, time.Now())
}

// GetUserAPIKeys 获取用户的所有API密钥
func (m *Manager) GetUserAPIKeys(userID int64) ([]*apikey.APIKey, error) {
	return m.repo.GetByUserID(userID)
}

// DeleteAPIKey 删除API密钥
func (m *Manager) DeleteAPIKey(id int64) error {
	return m.repo.Delete(id)
}

// CleanupExpiredKeys 清理过期密钥（定期任务）
func (m *Manager) CleanupExpiredKeys() error {
	return m.repo.DeleteExpired()
}

// HashAPIKey 计算API密钥哈希
func HashAPIKey(key string) string {
	hash := sha256.Sum256([]byte(key))
	return hex.EncodeToString(hash[:])
}

// RotateAPIKey 轮换API密钥
func (m *Manager) RotateAPIKey(oldID int64) (*apikey.APIKey, error) {
	// 获取旧密钥
	oldKey, err := m.repo.GetByID(oldID)
	if err != nil {
		return nil, fmt.Errorf("failed to get old API key: %w", err)
	}

	// 创建新密钥
	newKey, err := m.CreateAPIKey(oldKey.UserID, oldKey.Name, oldKey.Permissions, oldKey.ExpiresAt)
	if err != nil {
		return nil, fmt.Errorf("failed to create new API key: %w", err)
	}

	// 撤销旧密钥
	if err := m.RevokeAPIKey(oldID); err != nil {
		return nil, fmt.Errorf("failed to revoke old API key: %w", err)
	}

	return newKey, nil
}
