package audit

import (
	"time"
)

// ActionType 操作类型
type ActionType string

const (
	// 用户相关操作
	ActionUserLogin          ActionType = "user.login"
	ActionUserLogout         ActionType = "user.logout"
	ActionUserRegister       ActionType = "user.register"
	ActionUserUpdateProfile  ActionType = "user.update_profile"
	ActionUserChangePassword ActionType = "user.change_password"
	ActionUserDelete         ActionType = "user.delete"

	// 文章相关操作
	ActionArticleCreate  ActionType = "article.create"
	ActionArticleUpdate  ActionType = "article.update"
	ActionArticleDelete  ActionType = "article.delete"
	ActionArticlePublish ActionType = "article.publish"

	// 评论相关操作
	ActionCommentCreate ActionType = "comment.create"
	ActionCommentUpdate ActionType = "comment.update"
	ActionCommentDelete ActionType = "comment.delete"

	// 支付相关操作
	ActionPaymentCreate ActionType = "payment.create"
	ActionPaymentRefund ActionType = "payment.refund"

	// 管理员操作
	ActionAdminBanUser    ActionType = "admin.ban_user"
	ActionAdminUnbanUser  ActionType = "admin.unban_user"
	ActionAdminDeleteUser ActionType = "admin.delete_user"

	// API密钥操作
	ActionAPIKeyCreate ActionType = "apikey.create"
	ActionAPIKeyRevoke ActionType = "apikey.revoke"
)

// ResultType 操作结果
type ResultType string

const (
	ResultSuccess ResultType = "success"
	ResultFailure ResultType = "failure"
)

// AuditLog 审计日志
type AuditLog struct {
	ID           int64      `json:"id" db:"id"`
	UserID       *int64     `json:"userId,omitempty" db:"user_id"`
	Action       ActionType `json:"action" db:"action"`
	ResourceID   *int64     `json:"resourceId,omitempty" db:"resource_id"`
	ResourceType string     `json:"resourceType,omitempty" db:"resource_type"`
	IP           string     `json:"ip" db:"ip"`
	UserAgent    string     `json:"userAgent" db:"user_agent"`
	Result       ResultType `json:"result" db:"result"`
	ErrorMsg     string     `json:"errorMsg,omitempty" db:"error_msg"`
	Metadata     string     `json:"metadata,omitempty" db:"metadata"` // JSON格式的额外信息
	CreatedAt    time.Time  `json:"createdAt" db:"created_at"`
}

// AuditLogRepository 审计日志仓储接口
type AuditLogRepository interface {
	// Create 创建审计日志
	Create(log *AuditLog) error

	// GetByUserID 获取用户的审计日志
	GetByUserID(userID int64, limit, offset int) ([]*AuditLog, error)

	// GetByAction 获取指定操作的审计日志
	GetByAction(action ActionType, limit, offset int) ([]*AuditLog, error)

	// GetByIP 获取指定IP的审计日志
	GetByIP(ip string, limit, offset int) ([]*AuditLog, error)

	// GetByTimeRange 获取指定时间范围的审计日志
	GetByTimeRange(start, end time.Time, limit, offset int) ([]*AuditLog, error)

	// CountByUserID 统计用户的审计日志数量
	CountByUserID(userID int64) (int64, error)

	// CountFailedAttempts 统计失败尝试次数（用于安全监控）
	CountFailedAttempts(userID *int64, ip string, action ActionType, since time.Time) (int64, error)
}
