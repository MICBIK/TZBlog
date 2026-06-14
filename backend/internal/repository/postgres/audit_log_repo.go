package postgres

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/MICBIK/TZBlog/backend/internal/audit"
)

// AuditLogRepo 审计日志仓储实现
type AuditLogRepo struct {
	db *sql.DB
}

// NewAuditLogRepo 创建审计日志仓储
func NewAuditLogRepo(db *sql.DB) audit.AuditLogRepository {
	return &AuditLogRepo{db: db}
}

// Create 创建审计日志
func (r *AuditLogRepo) Create(log *audit.AuditLog) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		INSERT INTO audit_logs (user_id, action, resource_id, resource_type, ip, user_agent, result, error_msg, metadata, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		RETURNING id
	`

	err := r.db.QueryRowContext(
		ctx,
		query,
		log.UserID,
		log.Action,
		log.ResourceID,
		log.ResourceType,
		log.IP,
		log.UserAgent,
		log.Result,
		log.ErrorMsg,
		log.Metadata,
		log.CreatedAt,
	).Scan(&log.ID)

	return err
}

// GetByUserID 获取用户的审计日志
func (r *AuditLogRepo) GetByUserID(userID int64, limit, offset int) ([]*audit.AuditLog, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		SELECT id, user_id, action, resource_id, resource_type, ip, user_agent, result, error_msg, metadata, created_at
		FROM audit_logs
		WHERE user_id = $1
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3
	`

	rows, err := r.db.QueryContext(ctx, query, userID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return r.scanRows(rows)
}

// GetByAction 获取指定操作的审计日志
func (r *AuditLogRepo) GetByAction(action audit.ActionType, limit, offset int) ([]*audit.AuditLog, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		SELECT id, user_id, action, resource_id, resource_type, ip, user_agent, result, error_msg, metadata, created_at
		FROM audit_logs
		WHERE action = $1
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3
	`

	rows, err := r.db.QueryContext(ctx, query, action, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return r.scanRows(rows)
}

// GetByIP 获取指定IP的审计日志
func (r *AuditLogRepo) GetByIP(ip string, limit, offset int) ([]*audit.AuditLog, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		SELECT id, user_id, action, resource_id, resource_type, ip, user_agent, result, error_msg, metadata, created_at
		FROM audit_logs
		WHERE ip = $1
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3
	`

	rows, err := r.db.QueryContext(ctx, query, ip, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return r.scanRows(rows)
}

// GetByTimeRange 获取指定时间范围的审计日志
func (r *AuditLogRepo) GetByTimeRange(start, end time.Time, limit, offset int) ([]*audit.AuditLog, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		SELECT id, user_id, action, resource_id, resource_type, ip, user_agent, result, error_msg, metadata, created_at
		FROM audit_logs
		WHERE created_at BETWEEN $1 AND $2
		ORDER BY created_at DESC
		LIMIT $3 OFFSET $4
	`

	rows, err := r.db.QueryContext(ctx, query, start, end, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return r.scanRows(rows)
}

// CountByUserID 统计用户的审计日志数量
func (r *AuditLogRepo) CountByUserID(userID int64) (int64, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `SELECT COUNT(*) FROM audit_logs WHERE user_id = $1`

	var count int64
	err := r.db.QueryRowContext(ctx, query, userID).Scan(&count)
	return count, err
}

// CountFailedAttempts 统计失败尝试次数
func (r *AuditLogRepo) CountFailedAttempts(userID *int64, ip string, action audit.ActionType, since time.Time) (int64, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var query string
	var args []interface{}

	if userID != nil {
		query = `
			SELECT COUNT(*) FROM audit_logs
			WHERE user_id = $1 AND action = $2 AND result = $3 AND created_at >= $4
		`
		args = []interface{}{*userID, action, audit.ResultFailure, since}
	} else {
		query = `
			SELECT COUNT(*) FROM audit_logs
			WHERE ip = $1 AND action = $2 AND result = $3 AND created_at >= $4
		`
		args = []interface{}{ip, action, audit.ResultFailure, since}
	}

	var count int64
	err := r.db.QueryRowContext(ctx, query, args...).Scan(&count)
	return count, err
}

// scanRows 扫描行数据
func (r *AuditLogRepo) scanRows(rows *sql.Rows) ([]*audit.AuditLog, error) {
	var logs []*audit.AuditLog

	for rows.Next() {
		var log audit.AuditLog
		var userID, resourceID sql.NullInt64
		var resourceType, errorMsg, metadata sql.NullString

		err := rows.Scan(
			&log.ID,
			&userID,
			&log.Action,
			&resourceID,
			&resourceType,
			&log.IP,
			&log.UserAgent,
			&log.Result,
			&errorMsg,
			&metadata,
			&log.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan row: %w", err)
		}

		if userID.Valid {
			log.UserID = &userID.Int64
		}
		if resourceID.Valid {
			log.ResourceID = &resourceID.Int64
		}
		if resourceType.Valid {
			log.ResourceType = resourceType.String
		}
		if errorMsg.Valid {
			log.ErrorMsg = errorMsg.String
		}
		if metadata.Valid {
			log.Metadata = metadata.String
		}

		logs = append(logs, &log)
	}

	return logs, rows.Err()
}
