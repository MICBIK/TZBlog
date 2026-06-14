package postgres

import (
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/MICBIK/TZBlog/backend/internal/domain/user"
)

func TestPasswordHistoryRepo_Create(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("Failed to create mock: %v", err)
	}
	defer db.Close()

	repo := NewPasswordHistoryRepo(db)

	history := &user.PasswordHistory{
		UserID:    1,
		Password:  "$2a$10$hash",
		CreatedAt: time.Now(),
	}

	mock.ExpectQuery(`INSERT INTO password_history`).
		WithArgs(history.UserID, history.Password, sqlmock.AnyArg()).
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(1))

	err = repo.Create(history)
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	if history.ID != 1 {
		t.Errorf("Expected ID to be 1, got %d", history.ID)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("Unfulfilled expectations: %v", err)
	}
}

func TestPasswordHistoryRepo_GetRecentPasswords(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("Failed to create mock: %v", err)
	}
	defer db.Close()

	repo := NewPasswordHistoryRepo(db)

	userID := int64(1)
	limit := 3

	now := time.Now()
	rows := sqlmock.NewRows([]string{"id", "user_id", "password", "created_at"}).
		AddRow(3, userID, "$2a$10$hash3", now).
		AddRow(2, userID, "$2a$10$hash2", now.Add(-24*time.Hour)).
		AddRow(1, userID, "$2a$10$hash1", now.Add(-48*time.Hour))

	mock.ExpectQuery(`SELECT id, user_id, password, created_at FROM password_history`).
		WithArgs(userID, limit).
		WillReturnRows(rows)

	histories, err := repo.GetRecentPasswords(userID, limit)
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	if len(histories) != 3 {
		t.Errorf("Expected 3 histories, got %d", len(histories))
	}

	if histories[0].ID != 3 {
		t.Errorf("Expected first history ID to be 3, got %d", histories[0].ID)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("Unfulfilled expectations: %v", err)
	}
}

func TestPasswordHistoryRepo_DeleteOldPasswords(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("Failed to create mock: %v", err)
	}
	defer db.Close()

	repo := NewPasswordHistoryRepo(db)

	userID := int64(1)
	keepCount := 3

	mock.ExpectExec(`DELETE FROM password_history`).
		WithArgs(userID, keepCount).
		WillReturnResult(sqlmock.NewResult(0, 2))

	err = repo.DeleteOldPasswords(userID, keepCount)
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("Unfulfilled expectations: %v", err)
	}
}
