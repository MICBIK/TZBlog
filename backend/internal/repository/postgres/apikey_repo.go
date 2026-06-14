package postgres

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

	"github.com/MICBIK/TZBlog/backend/internal/domain/apikey"
)

// APIKeyRepo API密钥仓储实现
type APIKeyRepo struct {
	db *sql.DB
}

// NewAPIKeyRepo 创建API密钥仓储
func NewAPIKeyRepo(db *sql.DB) apikey.APIKeyRepository {
	return &APIKeyRepo{db: db}
}

// Create 创建API密钥
func (r *APIKeyRepo) Create(key *apikey.APIKey) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// 序列化权限
	permissions, err := json.Marshal(key.Permissions)
	if err != nil {
		return fmt.Errorf("failed to marshal permissions: %w", err)
	}

	query := `
		INSERT INTO api_keys (user_id, name, key_prefix, key_hash, permissions, expires_at, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id
	`

	err = r.db.QueryRowContext(
		ctx,
		query,
		key.UserID,
		key.Name,
		key.KeyPrefix,
		key.KeyHash,
		string(permissions),
		key.ExpiresAt,
		key.CreatedAt,
	).Scan(&key.ID)

	return err
}

// GetByID 根据ID获取API密钥
func (r *APIKeyRepo) GetByID(id int64) (*apikey.APIKey, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		SELECT id, user_id, name, key_prefix, key_hash, permissions, expires_at, last_used_at, is_revoked, created_at, revoked_at
		FROM api_keys
		WHERE id = $1
	`

	var key apikey.APIKey
	var permissionsJSON string
	var expiresAt, lastUsedAt, revokedAt sql.NullTime

	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&key.ID,
		&key.UserID,
		&key.Name,
		&key.KeyPrefix,
		&key.KeyHash,
		&permissionsJSON,
		&expiresAt,
		&lastUsedAt,
		&key.IsRevoked,
		&key.CreatedAt,
		&revokedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("API key not found")
		}
		return nil, err
	}

	// 反序列化权限
	if err := json.Unmarshal([]byte(permissionsJSON), &key.Permissions); err != nil {
		return nil, fmt.Errorf("failed to unmarshal permissions: %w", err)
	}

	if expiresAt.Valid {
		key.ExpiresAt = &expiresAt.Time
	}
	if lastUsedAt.Valid {
		key.LastUsedAt = &lastUsedAt.Time
	}
	if revokedAt.Valid {
		key.RevokedAt = &revokedAt.Time
	}

	return &key, nil
}

// GetByKeyHash 根据密钥哈希获取API密钥
func (r *APIKeyRepo) GetByKeyHash(keyHash string) (*apikey.APIKey, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		SELECT id, user_id, name, key_prefix, key_hash, permissions, expires_at, last_used_at, is_revoked, created_at, revoked_at
		FROM api_keys
		WHERE key_hash = $1
	`

	var key apikey.APIKey
	var permissionsJSON string
	var expiresAt, lastUsedAt, revokedAt sql.NullTime

	err := r.db.QueryRowContext(ctx, query, keyHash).Scan(
		&key.ID,
		&key.UserID,
		&key.Name,
		&key.KeyPrefix,
		&key.KeyHash,
		&permissionsJSON,
		&expiresAt,
		&lastUsedAt,
		&key.IsRevoked,
		&key.CreatedAt,
		&revokedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("API key not found")
		}
		return nil, err
	}

	// 反序列化权限
	if err := json.Unmarshal([]byte(permissionsJSON), &key.Permissions); err != nil {
		return nil, fmt.Errorf("failed to unmarshal permissions: %w", err)
	}

	if expiresAt.Valid {
		key.ExpiresAt = &expiresAt.Time
	}
	if lastUsedAt.Valid {
		key.LastUsedAt = &lastUsedAt.Time
	}
	if revokedAt.Valid {
		key.RevokedAt = &revokedAt.Time
	}

	return &key, nil
}

// GetByUserID 获取用户的所有API密钥
func (r *APIKeyRepo) GetByUserID(userID int64) ([]*apikey.APIKey, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		SELECT id, user_id, name, key_prefix, key_hash, permissions, expires_at, last_used_at, is_revoked, created_at, revoked_at
		FROM api_keys
		WHERE user_id = $1
		ORDER BY created_at DESC
	`

	rows, err := r.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var keys []*apikey.APIKey
	for rows.Next() {
		var key apikey.APIKey
		var permissionsJSON string
		var expiresAt, lastUsedAt, revokedAt sql.NullTime

		err := rows.Scan(
			&key.ID,
			&key.UserID,
			&key.Name,
			&key.KeyPrefix,
			&key.KeyHash,
			&permissionsJSON,
			&expiresAt,
			&lastUsedAt,
			&key.IsRevoked,
			&key.CreatedAt,
			&revokedAt,
		)
		if err != nil {
			return nil, err
		}

		// 反序列化权限
		if err := json.Unmarshal([]byte(permissionsJSON), &key.Permissions); err != nil {
			return nil, fmt.Errorf("failed to unmarshal permissions: %w", err)
		}

		if expiresAt.Valid {
			key.ExpiresAt = &expiresAt.Time
		}
		if lastUsedAt.Valid {
			key.LastUsedAt = &lastUsedAt.Time
		}
		if revokedAt.Valid {
			key.RevokedAt = &revokedAt.Time
		}

		keys = append(keys, &key)
	}

	return keys, rows.Err()
}

// UpdateLastUsed 更新最后使用时间
func (r *APIKeyRepo) UpdateLastUsed(id int64, lastUsedAt time.Time) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `UPDATE api_keys SET last_used_at = $1 WHERE id = $2`
	_, err := r.db.ExecContext(ctx, query, lastUsedAt, id)
	return err
}

// Revoke 撤销API密钥
func (r *APIKeyRepo) Revoke(id int64, revokedAt time.Time) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `UPDATE api_keys SET is_revoked = true, revoked_at = $1 WHERE id = $2`
	_, err := r.db.ExecContext(ctx, query, revokedAt, id)
	return err
}

// Delete 删除API密钥
func (r *APIKeyRepo) Delete(id int64) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `DELETE FROM api_keys WHERE id = $1`
	_, err := r.db.ExecContext(ctx, query, id)
	return err
}

// DeleteExpired 删除过期密钥
func (r *APIKeyRepo) DeleteExpired() error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `DELETE FROM api_keys WHERE expires_at < NOW()`
	_, err := r.db.ExecContext(ctx, query)
	return err
}
