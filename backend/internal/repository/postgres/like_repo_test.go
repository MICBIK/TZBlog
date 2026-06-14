package postgres

import (
	"testing"
	"time"

	"github.com/MICBIK/TZBlog/backend/internal/domain/like"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupLikeTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)

	err = db.Exec(`
		CREATE TABLE likes (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			user_id INTEGER NOT NULL,
			target_type VARCHAR(20) NOT NULL,
			target_id INTEGER NOT NULL,
			created_at DATETIME NOT NULL,
			UNIQUE (user_id, target_type, target_id)
		)
	`).Error
	require.NoError(t, err)

	return db
}

func newTestLike(userID int64, targetType like.TargetType, targetID int64) *like.Like {
	return &like.Like{
		UserID:     userID,
		TargetType: targetType,
		TargetID:   targetID,
		CreatedAt:  time.Now(),
	}
}

func TestLikeRepository_Create(t *testing.T) {
	tests := []struct {
		name      string
		setup     func(repo like.LikeRepository)
		input     *like.Like
		expectErr bool
	}{
		{
			name:      "successful create",
			setup:     func(repo like.LikeRepository) {},
			input:     newTestLike(1, like.TargetTypeArticle, 100),
			expectErr: false,
		},
		{
			name: "duplicate like fails",
			setup: func(repo like.LikeRepository) {
				_ = repo.Create(newTestLike(1, like.TargetTypeArticle, 100))
			},
			input:     newTestLike(1, like.TargetTypeArticle, 100),
			expectErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			db := setupLikeTestDB(t)
			repo := NewLikeRepository(db)
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

func TestLikeRepository_Delete(t *testing.T) {
	db := setupLikeTestDB(t)
	repo := NewLikeRepository(db)

	l := newTestLike(1, like.TargetTypeArticle, 100)
	require.NoError(t, repo.Create(l))

	err := repo.Delete(1, like.TargetTypeArticle, 100)
	require.NoError(t, err)

	liked, err := repo.IsLiked(1, like.TargetTypeArticle, 100)
	require.NoError(t, err)
	assert.False(t, liked)
}

func TestLikeRepository_IsLiked(t *testing.T) {
	db := setupLikeTestDB(t)
	repo := NewLikeRepository(db)

	require.NoError(t, repo.Create(newTestLike(1, like.TargetTypeArticle, 100)))

	t.Run("liked returns true", func(t *testing.T) {
		liked, err := repo.IsLiked(1, like.TargetTypeArticle, 100)
		require.NoError(t, err)
		assert.True(t, liked)
	})

	t.Run("not liked returns false", func(t *testing.T) {
		liked, err := repo.IsLiked(2, like.TargetTypeArticle, 100)
		require.NoError(t, err)
		assert.False(t, liked)
	})

	t.Run("different target type returns false", func(t *testing.T) {
		liked, err := repo.IsLiked(1, like.TargetTypeComment, 100)
		require.NoError(t, err)
		assert.False(t, liked)
	})
}

func TestLikeRepository_CountByTarget(t *testing.T) {
	db := setupLikeTestDB(t)
	repo := NewLikeRepository(db)

	// 3 users like article 100
	require.NoError(t, repo.Create(newTestLike(1, like.TargetTypeArticle, 100)))
	require.NoError(t, repo.Create(newTestLike(2, like.TargetTypeArticle, 100)))
	require.NoError(t, repo.Create(newTestLike(3, like.TargetTypeArticle, 100)))
	// 1 user likes comment 100
	require.NoError(t, repo.Create(newTestLike(1, like.TargetTypeComment, 100)))

	t.Run("counts article likes", func(t *testing.T) {
		count, err := repo.CountByTarget(like.TargetTypeArticle, 100)
		require.NoError(t, err)
		assert.Equal(t, int64(3), count)
	})

	t.Run("counts comment likes", func(t *testing.T) {
		count, err := repo.CountByTarget(like.TargetTypeComment, 100)
		require.NoError(t, err)
		assert.Equal(t, int64(1), count)
	})

	t.Run("zero for target without likes", func(t *testing.T) {
		count, err := repo.CountByTarget(like.TargetTypeArticle, 999)
		require.NoError(t, err)
		assert.Equal(t, int64(0), count)
	})
}
