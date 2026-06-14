package user

import (
	"time"
)

// PasswordHistory 密码历史记录
type PasswordHistory struct {
	ID        int64     `json:"id" db:"id"`
	UserID    int64     `json:"userId" db:"user_id"`
	Password  string    `json:"-" db:"password"` // bcrypt hash
	CreatedAt time.Time `json:"createdAt" db:"created_at"`
}

// PasswordHistoryRepository 密码历史仓储接口
type PasswordHistoryRepository interface {
	// Create 创建密码历史记录
	Create(history *PasswordHistory) error

	// GetRecentPasswords 获取用户最近N个密码
	GetRecentPasswords(userID int64, limit int) ([]*PasswordHistory, error)

	// DeleteOldPasswords 删除超过保留数量的旧密码
	DeleteOldPasswords(userID int64, keepCount int) error
}
