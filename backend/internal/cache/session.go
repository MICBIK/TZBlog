package cache

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

const (
	// SessionPrefix 会话前缀
	SessionPrefix = "session:"

	// UserSessionsPrefix 用户会话列表前缀
	UserSessionsPrefix = "user_sessions:"

	// DefaultSessionTimeout 默认会话超时时间（30分钟）
	DefaultSessionTimeout = 30 * time.Minute

	// MaxConcurrentSessions 最大并发会话数
	MaxConcurrentSessions = 3
)

// Session 会话信息
type Session struct {
	SessionID string    `json:"sessionId"`
	UserID    int64     `json:"userId"`
	Token     string    `json:"token"`
	IP        string    `json:"ip"`
	UserAgent string    `json:"userAgent"`
	CreatedAt time.Time `json:"createdAt"`
	LastSeen  time.Time `json:"lastSeen"`
}

// SessionManager 会话管理器
type SessionManager struct {
	client *redis.Client
}

// NewSessionManager 创建会话管理器
func NewSessionManager(client *redis.Client) *SessionManager {
	return &SessionManager{
		client: client,
	}
}

// CreateSession 创建会话
func (m *SessionManager) CreateSession(ctx context.Context, session *Session) error {
	// 检查并发会话数限制
	sessions, err := m.GetUserSessions(ctx, session.UserID)
	if err != nil {
		return fmt.Errorf("failed to get user sessions: %w", err)
	}

	// 如果超过最大并发会话数，删除最旧的会话
	if len(sessions) >= MaxConcurrentSessions {
		if err := m.RemoveOldestSession(ctx, session.UserID); err != nil {
			return fmt.Errorf("failed to remove oldest session: %w", err)
		}
	}

	// 序列化会话信息
	data, err := json.Marshal(session)
	if err != nil {
		return fmt.Errorf("failed to marshal session: %w", err)
	}

	// 存储会话信息
	sessionKey := SessionPrefix + session.SessionID
	if err := m.client.Set(ctx, sessionKey, data, DefaultSessionTimeout).Err(); err != nil {
		return fmt.Errorf("failed to set session: %w", err)
	}

	// 添加到用户会话列表
	userSessionsKey := UserSessionsPrefix + fmt.Sprintf("%d", session.UserID)
	if err := m.client.ZAdd(ctx, userSessionsKey, redis.Z{
		Score:  float64(session.CreatedAt.Unix()),
		Member: session.SessionID,
	}).Err(); err != nil {
		return fmt.Errorf("failed to add to user sessions: %w", err)
	}

	// 设置用户会话列表过期时间
	if err := m.client.Expire(ctx, userSessionsKey, DefaultSessionTimeout*2).Err(); err != nil {
		return fmt.Errorf("failed to set expire on user sessions: %w", err)
	}

	return nil
}

// GetSession 获取会话
func (m *SessionManager) GetSession(ctx context.Context, sessionID string) (*Session, error) {
	sessionKey := SessionPrefix + sessionID
	data, err := m.client.Get(ctx, sessionKey).Bytes()
	if err != nil {
		if err == redis.Nil {
			return nil, fmt.Errorf("session not found")
		}
		return nil, fmt.Errorf("failed to get session: %w", err)
	}

	var session Session
	if err := json.Unmarshal(data, &session); err != nil {
		return nil, fmt.Errorf("failed to unmarshal session: %w", err)
	}

	return &session, nil
}

// UpdateLastSeen 更新最后活动时间
func (m *SessionManager) UpdateLastSeen(ctx context.Context, sessionID string) error {
	session, err := m.GetSession(ctx, sessionID)
	if err != nil {
		return err
	}

	session.LastSeen = time.Now()

	data, err := json.Marshal(session)
	if err != nil {
		return fmt.Errorf("failed to marshal session: %w", err)
	}

	sessionKey := SessionPrefix + sessionID
	if err := m.client.Set(ctx, sessionKey, data, DefaultSessionTimeout).Err(); err != nil {
		return fmt.Errorf("failed to update session: %w", err)
	}

	return nil
}

// DeleteSession 删除会话
func (m *SessionManager) DeleteSession(ctx context.Context, sessionID string) error {
	// 获取会话信息
	session, err := m.GetSession(ctx, sessionID)
	if err != nil {
		// 会话不存在也视为成功
		return nil
	}

	// 删除会话
	sessionKey := SessionPrefix + sessionID
	if err := m.client.Del(ctx, sessionKey).Err(); err != nil {
		return fmt.Errorf("failed to delete session: %w", err)
	}

	// 从用户会话列表中删除
	userSessionsKey := UserSessionsPrefix + fmt.Sprintf("%d", session.UserID)
	if err := m.client.ZRem(ctx, userSessionsKey, sessionID).Err(); err != nil {
		return fmt.Errorf("failed to remove from user sessions: %w", err)
	}

	return nil
}

// DeleteUserSessions 删除用户所有会话
func (m *SessionManager) DeleteUserSessions(ctx context.Context, userID int64) error {
	sessions, err := m.GetUserSessions(ctx, userID)
	if err != nil {
		return err
	}

	for _, session := range sessions {
		if err := m.DeleteSession(ctx, session.SessionID); err != nil {
			return err
		}
	}

	// 删除用户会话列表
	userSessionsKey := UserSessionsPrefix + fmt.Sprintf("%d", userID)
	if err := m.client.Del(ctx, userSessionsKey).Err(); err != nil {
		return fmt.Errorf("failed to delete user sessions: %w", err)
	}

	return nil
}

// GetUserSessions 获取用户所有会话
func (m *SessionManager) GetUserSessions(ctx context.Context, userID int64) ([]*Session, error) {
	userSessionsKey := UserSessionsPrefix + fmt.Sprintf("%d", userID)

	// 获取所有会话ID
	sessionIDs, err := m.client.ZRange(ctx, userSessionsKey, 0, -1).Result()
	if err != nil {
		if err == redis.Nil {
			return []*Session{}, nil
		}
		return nil, fmt.Errorf("failed to get user sessions: %w", err)
	}

	sessions := make([]*Session, 0, len(sessionIDs))
	for _, sessionID := range sessionIDs {
		session, err := m.GetSession(ctx, sessionID)
		if err != nil {
			// 会话可能已过期，跳过
			continue
		}
		sessions = append(sessions, session)
	}

	return sessions, nil
}

// RemoveOldestSession 删除最旧的会话
func (m *SessionManager) RemoveOldestSession(ctx context.Context, userID int64) error {
	userSessionsKey := UserSessionsPrefix + fmt.Sprintf("%d", userID)

	// 获取最旧的会话ID
	sessionIDs, err := m.client.ZRange(ctx, userSessionsKey, 0, 0).Result()
	if err != nil {
		return fmt.Errorf("failed to get oldest session: %w", err)
	}

	if len(sessionIDs) == 0 {
		return nil
	}

	return m.DeleteSession(ctx, sessionIDs[0])
}

// CheckSessionTimeout 检查会话是否超时
func (m *SessionManager) CheckSessionTimeout(ctx context.Context, sessionID string) (bool, error) {
	session, err := m.GetSession(ctx, sessionID)
	if err != nil {
		return true, err
	}

	// 检查最后活动时间是否超过30分钟
	if time.Since(session.LastSeen) > DefaultSessionTimeout {
		// 删除超时会话
		if err := m.DeleteSession(ctx, sessionID); err != nil {
			return true, err
		}
		return true, nil
	}

	return false, nil
}

// CleanupExpiredSessions 清理过期会话（定期任务）
func (m *SessionManager) CleanupExpiredSessions(ctx context.Context, userID int64) error {
	sessions, err := m.GetUserSessions(ctx, userID)
	if err != nil {
		return err
	}

	for _, session := range sessions {
		if time.Since(session.LastSeen) > DefaultSessionTimeout {
			if err := m.DeleteSession(ctx, session.SessionID); err != nil {
				return err
			}
		}
	}

	return nil
}
