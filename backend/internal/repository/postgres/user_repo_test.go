package postgres

import (
	"testing"
	"time"

	"github.com/MICBIK/TZBlog/backend/internal/domain/user"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

// setupUserTestDB creates an in-memory SQLite DB with the users table.
func setupUserTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)

	// Create table manually for SQLite compatibility
	err = db.Exec(`
		CREATE TABLE users (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			username VARCHAR(50) NOT NULL UNIQUE,
			email VARCHAR(255) NOT NULL UNIQUE,
			password_hash VARCHAR(255) NOT NULL,
			display_name VARCHAR(100),
			bio VARCHAR(500),
			avatar_url VARCHAR(255),
			role VARCHAR(20) DEFAULT 'user',
			status VARCHAR(20) DEFAULT 'active',
			is_verified BOOLEAN DEFAULT 0,
			last_login_at DATETIME,
			created_at DATETIME NOT NULL,
			updated_at DATETIME NOT NULL,
			deleted_at DATETIME
		)
	`).Error
	require.NoError(t, err)

	return db
}

// newTestUser returns a valid user for insertion.
func newTestUser(username, email string) *user.User {
	now := time.Now()
	return &user.User{
		Username:     username,
		Email:        email,
		PasswordHash: "hashed_password",
		DisplayName:  "Test User",
		Role:         "user",
		Status:       user.StatusActive,
		CreatedAt:    now,
		UpdatedAt:    now,
	}
}

func TestUserRepository_Create(t *testing.T) {
	tests := []struct {
		name      string
		setup     func(repo user.UserRepository)
		input     *user.User
		expectErr bool
	}{
		{
			name:      "successful create",
			setup:     func(repo user.UserRepository) {},
			input:     newTestUser("alice", "alice@example.com"),
			expectErr: false,
		},
		{
			name: "duplicate email fails",
			setup: func(repo user.UserRepository) {
				_ = repo.Create(newTestUser("bob", "dup@example.com"))
			},
			input:     newTestUser("charlie", "dup@example.com"),
			expectErr: true,
		},
		{
			name: "duplicate username fails",
			setup: func(repo user.UserRepository) {
				_ = repo.Create(newTestUser("dave", "dave@example.com"))
			},
			input:     newTestUser("dave", "dave2@example.com"),
			expectErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			db := setupUserTestDB(t)
			repo := NewUserRepository(db)
			tt.setup(repo)

			err := repo.Create(tt.input)

			if tt.expectErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
				assert.NotZero(t, tt.input.ID)
			}
		})
	}
}

func TestUserRepository_FindByID(t *testing.T) {
	db := setupUserTestDB(t)
	repo := NewUserRepository(db)

	u := newTestUser("alice", "alice@example.com")
	require.NoError(t, repo.Create(u))

	t.Run("found", func(t *testing.T) {
		found, err := repo.FindByID(u.ID)
		require.NoError(t, err)
		require.NotNil(t, found)
		assert.Equal(t, u.Username, found.Username)
		assert.Equal(t, u.Email, found.Email)
	})

	t.Run("not found returns nil, nil", func(t *testing.T) {
		found, err := repo.FindByID(99999)
		assert.NoError(t, err)
		assert.Nil(t, found)
	})
}

func TestUserRepository_FindByEmail(t *testing.T) {
	db := setupUserTestDB(t)
	repo := NewUserRepository(db)

	u := newTestUser("alice", "alice@example.com")
	require.NoError(t, repo.Create(u))

	t.Run("found", func(t *testing.T) {
		found, err := repo.FindByEmail("alice@example.com")
		require.NoError(t, err)
		require.NotNil(t, found)
		assert.Equal(t, u.ID, found.ID)
	})

	t.Run("not found returns nil, nil", func(t *testing.T) {
		found, err := repo.FindByEmail("nonexistent@example.com")
		assert.NoError(t, err)
		assert.Nil(t, found)
	})
}

func TestUserRepository_FindByUsername(t *testing.T) {
	db := setupUserTestDB(t)
	repo := NewUserRepository(db)

	u := newTestUser("alice", "alice@example.com")
	require.NoError(t, repo.Create(u))

	t.Run("found", func(t *testing.T) {
		found, err := repo.FindByUsername("alice")
		require.NoError(t, err)
		require.NotNil(t, found)
		assert.Equal(t, u.ID, found.ID)
	})

	t.Run("not found returns nil, nil", func(t *testing.T) {
		found, err := repo.FindByUsername("nobody")
		assert.NoError(t, err)
		assert.Nil(t, found)
	})
}

func TestUserRepository_Update(t *testing.T) {
	db := setupUserTestDB(t)
	repo := NewUserRepository(db)

	u := newTestUser("alice", "alice@example.com")
	require.NoError(t, repo.Create(u))

	u.DisplayName = "Updated Name"
	u.Bio = "Updated bio"
	err := repo.Update(u)
	require.NoError(t, err)

	found, err := repo.FindByID(u.ID)
	require.NoError(t, err)
	require.NotNil(t, found)
	assert.Equal(t, "Updated Name", found.DisplayName)
	assert.Equal(t, "Updated bio", found.Bio)
}

func TestUserRepository_Delete(t *testing.T) {
	db := setupUserTestDB(t)
	repo := NewUserRepository(db)

	u := newTestUser("alice", "alice@example.com")
	require.NoError(t, repo.Create(u))

	err := repo.Delete(u.ID)
	require.NoError(t, err)

	found, err := repo.FindByID(u.ID)
	assert.NoError(t, err)
	assert.Nil(t, found)
}

func TestUserRepository_UpdateLastLogin(t *testing.T) {
	db := setupUserTestDB(t)
	repo := NewUserRepository(db)

	u := newTestUser("alice", "alice@example.com")
	require.NoError(t, repo.Create(u))
	assert.Nil(t, u.LastLoginAt)

	err := repo.UpdateLastLogin(u.ID)
	require.NoError(t, err)

	found, err := repo.FindByID(u.ID)
	require.NoError(t, err)
	require.NotNil(t, found)
	assert.NotNil(t, found.LastLoginAt)
}

func TestUserRepository_List(t *testing.T) {
	db := setupUserTestDB(t)
	repo := NewUserRepository(db)

	// Seed 5 users
	for i := 0; i < 5; i++ {
		username := "user" + string(rune('a'+i))
		email := username + "@example.com"
		require.NoError(t, repo.Create(newTestUser(username, email)))
	}

	t.Run("list all", func(t *testing.T) {
		users, total, err := repo.List(10, 0)
		require.NoError(t, err)
		assert.Equal(t, int64(5), total)
		assert.Len(t, users, 5)
	})

	t.Run("list with limit", func(t *testing.T) {
		users, total, err := repo.List(2, 0)
		require.NoError(t, err)
		assert.Equal(t, int64(5), total)
		assert.Len(t, users, 2)
	})

	t.Run("list with offset", func(t *testing.T) {
		users, total, err := repo.List(10, 3)
		require.NoError(t, err)
		assert.Equal(t, int64(5), total)
		assert.Len(t, users, 2)
	})

	t.Run("empty result on large offset", func(t *testing.T) {
		users, total, err := repo.List(10, 100)
		require.NoError(t, err)
		assert.Equal(t, int64(5), total)
		assert.Empty(t, users)
	})
}
