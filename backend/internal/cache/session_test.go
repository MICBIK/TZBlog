package cache

import (
	"context"
	"encoding/json"
	"testing"
	"time"

	"github.com/alicebob/miniredis/v2"
	"github.com/redis/go-redis/v9"
)

func setupTestRedis(t *testing.T) (*redis.Client, *miniredis.Miniredis) {
	mr, err := miniredis.Run()
	if err != nil {
		t.Fatalf("Failed to start miniredis: %v", err)
	}

	client := redis.NewClient(&redis.Options{
		Addr: mr.Addr(),
	})

	return client, mr
}

func TestSessionManager_CreateSession(t *testing.T) {
	client, mr := setupTestRedis(t)
	defer mr.Close()
	defer client.Close()

	manager := NewSessionManager(client)
	ctx := context.Background()

	session := &Session{
		SessionID: "session-1",
		UserID:    1,
		Token:     "token-1",
		IP:        "127.0.0.1",
		UserAgent: "test-agent",
		CreatedAt: time.Now(),
		LastSeen:  time.Now(),
	}

	err := manager.CreateSession(ctx, session)
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	// 验证会话已创建
	retrieved, err := manager.GetSession(ctx, session.SessionID)
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	if retrieved.SessionID != session.SessionID {
		t.Errorf("Expected SessionID %s, got %s", session.SessionID, retrieved.SessionID)
	}

	if retrieved.UserID != session.UserID {
		t.Errorf("Expected UserID %d, got %d", session.UserID, retrieved.UserID)
	}
}

func TestSessionManager_MaxConcurrentSessions(t *testing.T) {
	client, mr := setupTestRedis(t)
	defer mr.Close()
	defer client.Close()

	manager := NewSessionManager(client)
	ctx := context.Background()

	userID := int64(1)

	// 创建4个会话（超过最大限制3个）
	for i := 1; i <= 4; i++ {
		session := &Session{
			SessionID: "session-" + string(rune('0'+i)),
			UserID:    userID,
			Token:     "token-" + string(rune('0'+i)),
			IP:        "127.0.0.1",
			UserAgent: "test-agent",
			CreatedAt: time.Now().Add(time.Duration(i) * time.Second),
			LastSeen:  time.Now().Add(time.Duration(i) * time.Second),
		}

		err := manager.CreateSession(ctx, session)
		if err != nil {
			t.Errorf("Expected no error, got %v", err)
		}
	}

	// 验证只保留3个会话
	sessions, err := manager.GetUserSessions(ctx, userID)
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	if len(sessions) != MaxConcurrentSessions {
		t.Errorf("Expected %d sessions, got %d", MaxConcurrentSessions, len(sessions))
	}

	// 验证最旧的会话被删除
	_, err = manager.GetSession(ctx, "session-1")
	if err == nil {
		t.Error("Expected oldest session to be deleted")
	}
}

func TestSessionManager_UpdateLastSeen(t *testing.T) {
	client, mr := setupTestRedis(t)
	defer mr.Close()
	defer client.Close()

	manager := NewSessionManager(client)
	ctx := context.Background()

	session := &Session{
		SessionID: "session-1",
		UserID:    1,
		Token:     "token-1",
		IP:        "127.0.0.1",
		UserAgent: "test-agent",
		CreatedAt: time.Now(),
		LastSeen:  time.Now().Add(-10 * time.Minute),
	}

	err := manager.CreateSession(ctx, session)
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	// 等待一小段时间
	time.Sleep(100 * time.Millisecond)

	// 更新最后活动时间
	err = manager.UpdateLastSeen(ctx, session.SessionID)
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	// 验证最后活动时间已更新
	retrieved, err := manager.GetSession(ctx, session.SessionID)
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	if !retrieved.LastSeen.After(session.LastSeen) {
		t.Error("Expected LastSeen to be updated")
	}
}

func TestSessionManager_DeleteSession(t *testing.T) {
	client, mr := setupTestRedis(t)
	defer mr.Close()
	defer client.Close()

	manager := NewSessionManager(client)
	ctx := context.Background()

	session := &Session{
		SessionID: "session-1",
		UserID:    1,
		Token:     "token-1",
		IP:        "127.0.0.1",
		UserAgent: "test-agent",
		CreatedAt: time.Now(),
		LastSeen:  time.Now(),
	}

	err := manager.CreateSession(ctx, session)
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	// 删除会话
	err = manager.DeleteSession(ctx, session.SessionID)
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	// 验证会话已删除
	_, err = manager.GetSession(ctx, session.SessionID)
	if err == nil {
		t.Error("Expected session to be deleted")
	}
}

func TestSessionManager_DeleteUserSessions(t *testing.T) {
	client, mr := setupTestRedis(t)
	defer mr.Close()
	defer client.Close()

	manager := NewSessionManager(client)
	ctx := context.Background()

	userID := int64(1)

	// 创建3个会话
	for i := 1; i <= 3; i++ {
		session := &Session{
			SessionID: "session-" + string(rune('0'+i)),
			UserID:    userID,
			Token:     "token-" + string(rune('0'+i)),
			IP:        "127.0.0.1",
			UserAgent: "test-agent",
			CreatedAt: time.Now(),
			LastSeen:  time.Now(),
		}

		err := manager.CreateSession(ctx, session)
		if err != nil {
			t.Errorf("Expected no error, got %v", err)
		}
	}

	// 删除用户所有会话
	err := manager.DeleteUserSessions(ctx, userID)
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	// 验证所有会话已删除
	sessions, err := manager.GetUserSessions(ctx, userID)
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	if len(sessions) != 0 {
		t.Errorf("Expected 0 sessions, got %d", len(sessions))
	}
}

func TestSessionManager_GetUserSessions(t *testing.T) {
	client, mr := setupTestRedis(t)
	defer mr.Close()
	defer client.Close()

	manager := NewSessionManager(client)
	ctx := context.Background()

	userID := int64(1)

	// 创建3个会话
	for i := 1; i <= 3; i++ {
		session := &Session{
			SessionID: "session-" + string(rune('0'+i)),
			UserID:    userID,
			Token:     "token-" + string(rune('0'+i)),
			IP:        "127.0.0.1",
			UserAgent: "test-agent",
			CreatedAt: time.Now(),
			LastSeen:  time.Now(),
		}

		err := manager.CreateSession(ctx, session)
		if err != nil {
			t.Errorf("Expected no error, got %v", err)
		}
	}

	// 获取用户所有会话
	sessions, err := manager.GetUserSessions(ctx, userID)
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	if len(sessions) != 3 {
		t.Errorf("Expected 3 sessions, got %d", len(sessions))
	}
}

func TestSessionManager_CheckSessionTimeout(t *testing.T) {
	client, mr := setupTestRedis(t)
	defer mr.Close()
	defer client.Close()

	manager := NewSessionManager(client)
	ctx := context.Background()

	// 创建一个超时的会话
	session := &Session{
		SessionID: "session-1",
		UserID:    1,
		Token:     "token-1",
		IP:        "127.0.0.1",
		UserAgent: "test-agent",
		CreatedAt: time.Now().Add(-1 * time.Hour),
		LastSeen:  time.Now().Add(-1 * time.Hour),
	}

	// 手动存储到Redis
	data, _ := json.Marshal(session)
	sessionKey := SessionPrefix + session.SessionID
	client.Set(ctx, sessionKey, data, time.Hour)

	// 检查会话超时
	timeout, err := manager.CheckSessionTimeout(ctx, session.SessionID)
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	if !timeout {
		t.Error("Expected session to be timeout")
	}

	// 验证会话已删除
	_, err = manager.GetSession(ctx, session.SessionID)
	if err == nil {
		t.Error("Expected session to be deleted")
	}
}
