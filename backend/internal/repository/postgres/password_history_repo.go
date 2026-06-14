package postgres

import (
	"context"
	"database/sql"
	"time"

	"github.com/MICBIK/TZBlog/backend/internal/domain/user"
)

// PasswordHistoryRepo 密码历史仓储实现
type PasswordHistoryRepo struct {
	db *sql.DB
}

// NewPasswordHistoryRepo 创建密码历史仓储
func NewPasswordHistoryRepo(db *sql.DB) user.PasswordHistoryRepository {
	return &PasswordHistoryRepo{db: db}
}

// Create 创建密码历史记录
func (r *PasswordHistoryRepo) Create(history *user.PasswordHistory) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		INSERT INTO password_history (user_id, password, created_at)
		VALUES ($1, $2, $3)
		RETURNING id
	`

	err := r.db.QueryRowContext(
		ctx,
		query,
		history.UserID,
		history.Password,
		history.CreatedAt,
	).Scan(&history.ID)

	return err
}

// GetRecentPasswords 获取用户最近N个密码
func (r *PasswordHistoryRepo) GetRecentPasswords(userID int64, limit int) ([]*user.PasswordHistory, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		SELECT id, user_id, password, created_at
		FROM password_history
		WHERE user_id = $1
		ORDER BY created_at DESC
		LIMIT $2
	`

	rows, err := r.db.QueryContext(ctx, query, userID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var histories []*user.PasswordHistory
	for rows.Next() {
		var h user.PasswordHistory
		if err := rows.Scan(
			&h.ID,
			&h.UserID,
			&h.Password,
			&h.CreatedAt,
		); err != nil {
			return nil, err
		}
		histories = append(histories, &h)
	}

	return histories, rows.Err()
}

// DeleteOldPasswords 删除超过保留数量的旧密码
func (r *PasswordHistoryRepo) DeleteOldPasswords(userID int64, keepCount int) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		DELETE FROM password_history
		WHERE id IN (
			SELECT id FROM password_history
			WHERE user_id = $1
			ORDER BY created_at DESC
			OFFSET $2
		)
	`

	_, err := r.db.ExecContext(ctx, query, userID, keepCount)
	return err
}
