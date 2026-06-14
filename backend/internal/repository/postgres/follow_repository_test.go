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

func setupFollowTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)

	err = db.Exec(`
		CREATE TABLE follows (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			follower_id INTEGER NOT NULL,
			following_id INTEGER NOT NULL,
			created_at DATETIME NOT NULL,
			UNIQUE (follower_id, following_id)
		)
	`).Error
	require.NoError(t, err)

	// users table needed for join queries in GetFollowers/GetFollowing
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

func seedFollowUser(t *testing.T, db *gorm.DB, username string) int64 {
	repo := NewUserRepository(db)
	u := &user.User{
		Username:     username,
		Email:        username + "@example.com",
		PasswordHash: "hash",
		Status:       user.StatusActive,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}
	require.NoError(t, repo.Create(u))
	return u.ID
}

func TestFollowRepository_Follow(t *testing.T) {
	t.Run("successful follow", func(t *testing.T) {
		db := setupFollowTestDB(t)
		repo := NewFollowRepository(db)

		err := repo.Follow(1, 2)
		assert.NoError(t, err)

		following, err := repo.IsFollowing(1, 2)
		require.NoError(t, err)
		assert.True(t, following)
	})

	t.Run("cannot follow self", func(t *testing.T) {
		db := setupFollowTestDB(t)
		repo := NewFollowRepository(db)

		err := repo.Follow(1, 1)
		assert.Error(t, err)
	})

	t.Run("duplicate follow fails", func(t *testing.T) {
		db := setupFollowTestDB(t)
		repo := NewFollowRepository(db)

		require.NoError(t, repo.Follow(1, 2))
		err := repo.Follow(1, 2)
		assert.Error(t, err)
	})
}

func TestFollowRepository_Unfollow(t *testing.T) {
	db := setupFollowTestDB(t)
	repo := NewFollowRepository(db)

	require.NoError(t, repo.Follow(1, 2))

	err := repo.Unfollow(1, 2)
	require.NoError(t, err)

	following, err := repo.IsFollowing(1, 2)
	require.NoError(t, err)
	assert.False(t, following)
}

func TestFollowRepository_IsFollowing(t *testing.T) {
	db := setupFollowTestDB(t)
	repo := NewFollowRepository(db)

	require.NoError(t, repo.Follow(1, 2))

	t.Run("following returns true", func(t *testing.T) {
		following, err := repo.IsFollowing(1, 2)
		require.NoError(t, err)
		assert.True(t, following)
	})

	t.Run("not following returns false", func(t *testing.T) {
		following, err := repo.IsFollowing(1, 3)
		require.NoError(t, err)
		assert.False(t, following)
	})
}

func TestFollowRepository_GetFollowers(t *testing.T) {
	db := setupFollowTestDB(t)
	repo := NewFollowRepository(db)

	target := seedFollowUser(t, db, "target")
	f1 := seedFollowUser(t, db, "follower1")
	f2 := seedFollowUser(t, db, "follower2")

	require.NoError(t, repo.Follow(f1, target))
	require.NoError(t, repo.Follow(f2, target))

	followers, total, err := repo.GetFollowers(target, 10, 0)
	require.NoError(t, err)
	assert.Equal(t, int64(2), total)
	assert.Len(t, followers, 2)
}

func TestFollowRepository_GetFollowing(t *testing.T) {
	db := setupFollowTestDB(t)
	repo := NewFollowRepository(db)

	follower := seedFollowUser(t, db, "follower")
	t1 := seedFollowUser(t, db, "target1")
	t2 := seedFollowUser(t, db, "target2")

	require.NoError(t, repo.Follow(follower, t1))
	require.NoError(t, repo.Follow(follower, t2))

	following, total, err := repo.GetFollowing(follower, 10, 0)
	require.NoError(t, err)
	assert.Equal(t, int64(2), total)
	assert.Len(t, following, 2)
}

func TestFollowRepository_GetFollowerCount(t *testing.T) {
	db := setupFollowTestDB(t)
	repo := NewFollowRepository(db)

	require.NoError(t, repo.Follow(1, 10))
	require.NoError(t, repo.Follow(2, 10))
	require.NoError(t, repo.Follow(3, 10))

	count, err := repo.GetFollowerCount(10)
	require.NoError(t, err)
	assert.Equal(t, int64(3), count)
}

func TestFollowRepository_GetFollowingCount(t *testing.T) {
	db := setupFollowTestDB(t)
	repo := NewFollowRepository(db)

	require.NoError(t, repo.Follow(1, 10))
	require.NoError(t, repo.Follow(1, 11))

	count, err := repo.GetFollowingCount(1)
	require.NoError(t, err)
	assert.Equal(t, int64(2), count)
}
