package postgres

import (
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/MICBIK/TZBlog/backend/internal/domain/user"
	"github.com/stretchr/testify/assert"
)

func TestUserRepository_Create(t *testing.T) {
	db, mock := setupMockDB(t)
	repo := NewUserRepository(db)

	newUser := &user.User{
		Username:     "testuser",
		Email:        "test@example.com",
		PasswordHash: "hashed_password",
		Role:         "user",
	}

	mock.ExpectBegin()
	mock.ExpectQuery(`INSERT INTO "users"`).
		WithArgs(
			sqlmock.AnyArg(), // username
			sqlmock.AnyArg(), // email
			sqlmock.AnyArg(), // password_hash
			sqlmock.AnyArg(), // display_name
			sqlmock.AnyArg(), // bio
			sqlmock.AnyArg(), // avatar_url
			sqlmock.AnyArg(), // role
			sqlmock.AnyArg(), // is_verified
			sqlmock.AnyArg(), // created_at
			sqlmock.AnyArg(), // updated_at
			sqlmock.AnyArg(), // deleted_at
		).
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(1))
	mock.ExpectCommit()

	err := repo.Create(newUser)
	assert.NoError(t, err)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestUserRepository_FindByEmail(t *testing.T) {
	db, mock := setupMockDB(t)
	repo := NewUserRepository(db)

	email := "test@example.com"

	rows := sqlmock.NewRows([]string{
		"id", "username", "email", "password_hash", "role", "is_verified",
	}).AddRow(1, "testuser", email, "hashed", "user", true)

	mock.ExpectQuery(`SELECT .* FROM "users" WHERE email`).
		WithArgs(email, 1).
		WillReturnRows(rows)

	result, err := repo.FindByEmail(email)
	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, email, result.Email)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestUserRepository_FindByEmail_NotFound(t *testing.T) {
	db, mock := setupMockDB(t)
	repo := NewUserRepository(db)

	email := "notfound@example.com"

	mock.ExpectQuery(`SELECT .* FROM "users" WHERE email`).
		WithArgs(email, 1).
		WillReturnRows(sqlmock.NewRows([]string{}))

	result, err := repo.FindByEmail(email)
	assert.NoError(t, err)
	assert.Nil(t, result)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestUserRepository_FindByID(t *testing.T) {
	db, mock := setupMockDB(t)
	repo := NewUserRepository(db)

	userID := int64(123)

	rows := sqlmock.NewRows([]string{
		"id", "username", "email", "password_hash", "role",
	}).AddRow(userID, "testuser", "test@example.com", "hashed", "user")

	mock.ExpectQuery(`SELECT .* FROM "users" WHERE id`).
		WithArgs(userID, 1).
		WillReturnRows(rows)

	result, err := repo.FindByID(userID)
	if err != nil {
		t.Fatalf("FindByID failed: %v", err)
	}
	assert.NotNil(t, result)
	assert.Equal(t, userID, result.ID)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestUserRepository_Update(t *testing.T) {
	db, mock := setupMockDB(t)
	repo := NewUserRepository(db)

	existingUser := &user.User{
		ID:           1,
		Username:     "testuser",
		Email:        "test@example.com",
		PasswordHash: "hashed",
		DisplayName:  "Updated Name",
		Role:         "user",
	}

	mock.ExpectBegin()
	mock.ExpectExec(`UPDATE "users"`).
		WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectCommit()

	err := repo.Update(existingUser)
	assert.NoError(t, err)
	assert.NoError(t, mock.ExpectationsWereMet())
}
