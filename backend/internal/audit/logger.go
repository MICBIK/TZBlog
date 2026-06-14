package audit

import (
	"context"
	"encoding/json"
	"fmt"
	"time"
)

// Logger 审计日志记录器
type Logger struct {
	repo AuditLogRepository
}

// NewLogger 创建审计日志记录器
func NewLogger(repo AuditLogRepository) *Logger {
	return &Logger{repo: repo}
}

// LogOptions 日志选项
type LogOptions struct {
	UserID       *int64
	Action       ActionType
	ResourceID   *int64
	ResourceType string
	IP           string
	UserAgent    string
	Result       ResultType
	ErrorMsg     string
	Metadata     map[string]interface{}
}

// Log 记录审计日志
func (l *Logger) Log(ctx context.Context, opts LogOptions) error {
	log := &AuditLog{
		UserID:       opts.UserID,
		Action:       opts.Action,
		ResourceID:   opts.ResourceID,
		ResourceType: opts.ResourceType,
		IP:           opts.IP,
		UserAgent:    opts.UserAgent,
		Result:       opts.Result,
		ErrorMsg:     opts.ErrorMsg,
		CreatedAt:    time.Now(),
	}

	// 序列化元数据
	if opts.Metadata != nil {
		metadata, err := json.Marshal(opts.Metadata)
		if err != nil {
			return fmt.Errorf("failed to marshal metadata: %w", err)
		}
		log.Metadata = string(metadata)
	}

	return l.repo.Create(log)
}

// LogSuccess 记录成功操作
func (l *Logger) LogSuccess(ctx context.Context, opts LogOptions) error {
	opts.Result = ResultSuccess
	return l.Log(ctx, opts)
}

// LogFailure 记录失败操作
func (l *Logger) LogFailure(ctx context.Context, opts LogOptions) error {
	opts.Result = ResultFailure
	return l.Log(ctx, opts)
}

// LogUserLogin 记录用户登录
func (l *Logger) LogUserLogin(ctx context.Context, userID int64, ip, userAgent string, success bool, errorMsg string) error {
	opts := LogOptions{
		UserID:    &userID,
		Action:    ActionUserLogin,
		IP:        ip,
		UserAgent: userAgent,
		ErrorMsg:  errorMsg,
	}

	if success {
		return l.LogSuccess(ctx, opts)
	}
	return l.LogFailure(ctx, opts)
}

// LogUserLogout 记录用户登出
func (l *Logger) LogUserLogout(ctx context.Context, userID int64, ip, userAgent string) error {
	return l.LogSuccess(ctx, LogOptions{
		UserID:    &userID,
		Action:    ActionUserLogout,
		IP:        ip,
		UserAgent: userAgent,
	})
}

// LogPasswordChange 记录密码修改
func (l *Logger) LogPasswordChange(ctx context.Context, userID int64, ip, userAgent string, success bool, errorMsg string) error {
	opts := LogOptions{
		UserID:    &userID,
		Action:    ActionUserChangePassword,
		IP:        ip,
		UserAgent: userAgent,
		ErrorMsg:  errorMsg,
	}

	if success {
		return l.LogSuccess(ctx, opts)
	}
	return l.LogFailure(ctx, opts)
}

// LogArticleOperation 记录文章操作
func (l *Logger) LogArticleOperation(ctx context.Context, userID, articleID int64, action ActionType, ip, userAgent string) error {
	return l.LogSuccess(ctx, LogOptions{
		UserID:       &userID,
		Action:       action,
		ResourceID:   &articleID,
		ResourceType: "article",
		IP:           ip,
		UserAgent:    userAgent,
	})
}

// LogPaymentOperation 记录支付操作
func (l *Logger) LogPaymentOperation(ctx context.Context, userID, paymentID int64, action ActionType, ip, userAgent string, metadata map[string]interface{}) error {
	return l.LogSuccess(ctx, LogOptions{
		UserID:       &userID,
		Action:       action,
		ResourceID:   &paymentID,
		ResourceType: "payment",
		IP:           ip,
		UserAgent:    userAgent,
		Metadata:     metadata,
	})
}

// LogAdminOperation 记录管理员操作
func (l *Logger) LogAdminOperation(ctx context.Context, adminID, targetUserID int64, action ActionType, ip, userAgent string, reason string) error {
	metadata := map[string]interface{}{
		"target_user_id": targetUserID,
		"reason":         reason,
	}

	return l.LogSuccess(ctx, LogOptions{
		UserID:    &adminID,
		Action:    action,
		IP:        ip,
		UserAgent: userAgent,
		Metadata:  metadata,
	})
}

// CheckSuspiciousActivity 检查可疑活动
func (l *Logger) CheckSuspiciousActivity(ctx context.Context, userID *int64, ip string, action ActionType, threshold int64, window time.Duration) (bool, error) {
	since := time.Now().Add(-window)
	count, err := l.repo.CountFailedAttempts(userID, ip, action, since)
	if err != nil {
		return false, fmt.Errorf("failed to count failed attempts: %w", err)
	}

	return count >= threshold, nil
}
