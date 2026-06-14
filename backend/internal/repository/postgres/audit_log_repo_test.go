package postgres

import (
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/MICBIK/TZBlog/backend/internal/audit"
)

func TestAuditLogRepo_Create(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("Failed to create mock: %v", err)
	}
	defer db.Close()

	repo := NewAuditLogRepo(db)

	userID := int64(1)
	log := &audit.AuditLog{
		UserID:    &userID,
		Action:    audit.ActionUserLogin,
		IP:        "127.0.0.1",
		UserAgent: "test-agent",
		Result:    audit.ResultSuccess,
		CreatedAt: time.Now(),
	}

	mock.ExpectQuery(`INSERT INTO audit_logs`).
		WithArgs(log.UserID, log.Action, log.ResourceID, log.ResourceType, log.IP, log.UserAgent, log.Result, log.ErrorMsg, log.Metadata, sqlmock.AnyArg()).
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(1))

	err = repo.Create(log)
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	if log.ID != 1 {
		t.Errorf("Expected ID to be 1, got %d", log.ID)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("Unfulfilled expectations: %v", err)
	}
}

func TestAuditLogRepo_GetByUserID(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("Failed to create mock: %v", err)
	}
	defer db.Close()

	repo := NewAuditLogRepo(db)

	userID := int64(1)
	now := time.Now()

	rows := sqlmock.NewRows([]string{
		"id", "user_id", "action", "resource_id", "resource_type",
		"ip", "user_agent", "result", "error_msg", "metadata", "created_at",
	}).
		AddRow(1, userID, audit.ActionUserLogin, nil, nil, "127.0.0.1", "test-agent", audit.ResultSuccess, "", "", now).
		AddRow(2, userID, audit.ActionUserLogout, nil, nil, "127.0.0.1", "test-agent", audit.ResultSuccess, "", "", now)

	mock.ExpectQuery(`SELECT (.+) FROM audit_logs WHERE user_id`).
		WithArgs(userID, 10, 0).
		WillReturnRows(rows)

	logs, err := repo.GetByUserID(userID, 10, 0)
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	if len(logs) != 2 {
		t.Errorf("Expected 2 logs, got %d", len(logs))
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("Unfulfilled expectations: %v", err)
	}
}

func TestAuditLogRepo_GetByAction(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("Failed to create mock: %v", err)
	}
	defer db.Close()

	repo := NewAuditLogRepo(db)

	action := audit.ActionUserLogin
	now := time.Now()
	userID := int64(1)

	rows := sqlmock.NewRows([]string{
		"id", "user_id", "action", "resource_id", "resource_type",
		"ip", "user_agent", "result", "error_msg", "metadata", "created_at",
	}).
		AddRow(1, userID, action, nil, nil, "127.0.0.1", "test-agent", audit.ResultSuccess, "", "", now)

	mock.ExpectQuery(`SELECT (.+) FROM audit_logs WHERE action`).
		WithArgs(action, 10, 0).
		WillReturnRows(rows)

	logs, err := repo.GetByAction(action, 10, 0)
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	if len(logs) != 1 {
		t.Errorf("Expected 1 log, got %d", len(logs))
	}

	if logs[0].Action != action {
		t.Errorf("Expected action %s, got %s", action, logs[0].Action)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("Unfulfilled expectations: %v", err)
	}
}

func TestAuditLogRepo_GetByIP(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("Failed to create mock: %v", err)
	}
	defer db.Close()

	repo := NewAuditLogRepo(db)

	ip := "127.0.0.1"
	now := time.Now()
	userID := int64(1)

	rows := sqlmock.NewRows([]string{
		"id", "user_id", "action", "resource_id", "resource_type",
		"ip", "user_agent", "result", "error_msg", "metadata", "created_at",
	}).
		AddRow(1, userID, audit.ActionUserLogin, nil, nil, ip, "test-agent", audit.ResultSuccess, "", "", now)

	mock.ExpectQuery(`SELECT (.+) FROM audit_logs WHERE ip`).
		WithArgs(ip, 10, 0).
		WillReturnRows(rows)

	logs, err := repo.GetByIP(ip, 10, 0)
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	if len(logs) != 1 {
		t.Errorf("Expected 1 log, got %d", len(logs))
	}

	if logs[0].IP != ip {
		t.Errorf("Expected IP %s, got %s", ip, logs[0].IP)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("Unfulfilled expectations: %v", err)
	}
}

func TestAuditLogRepo_CountByUserID(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("Failed to create mock: %v", err)
	}
	defer db.Close()

	repo := NewAuditLogRepo(db)

	userID := int64(1)

	mock.ExpectQuery(`SELECT COUNT\(\*\) FROM audit_logs WHERE user_id`).
		WithArgs(userID).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(5))

	count, err := repo.CountByUserID(userID)
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	if count != 5 {
		t.Errorf("Expected count 5, got %d", count)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("Unfulfilled expectations: %v", err)
	}
}

func TestAuditLogRepo_CountFailedAttempts(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("Failed to create mock: %v", err)
	}
	defer db.Close()

	repo := NewAuditLogRepo(db)

	userID := int64(1)
	action := audit.ActionUserLogin
	since := time.Now().Add(-1 * time.Hour)

	mock.ExpectQuery(`SELECT COUNT\(\*\) FROM audit_logs WHERE user_id`).
		WithArgs(userID, action, audit.ResultFailure, since).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(3))

	count, err := repo.CountFailedAttempts(&userID, "", action, since)
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	if count != 3 {
		t.Errorf("Expected count 3, got %d", count)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("Unfulfilled expectations: %v", err)
	}
}

func TestAuditLogRepo_CountFailedAttemptsByIP(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("Failed to create mock: %v", err)
	}
	defer db.Close()

	repo := NewAuditLogRepo(db)

	ip := "127.0.0.1"
	action := audit.ActionUserLogin
	since := time.Now().Add(-1 * time.Hour)

	mock.ExpectQuery(`SELECT COUNT\(\*\) FROM audit_logs WHERE ip`).
		WithArgs(ip, action, audit.ResultFailure, since).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(2))

	count, err := repo.CountFailedAttempts(nil, ip, action, since)
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	if count != 2 {
		t.Errorf("Expected count 2, got %d", count)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("Unfulfilled expectations: %v", err)
	}
}
