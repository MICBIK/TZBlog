package postgres

import (
	"testing"
	"time"

	"github.com/MICBIK/TZBlog/backend/internal/domain/progress"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupProgressTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)

	err = db.Exec(`
		CREATE TABLE reading_progress (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			user_id INTEGER NOT NULL,
			article_id INTEGER NOT NULL,
			percentage INTEGER DEFAULT 0,
			last_read_at DATETIME,
			created_at DATETIME NOT NULL,
			updated_at DATETIME NOT NULL,
			UNIQUE (user_id, article_id)
		)
	`).Error
	require.NoError(t, err)

	return db
}

func newTestProgress(userID, articleID int64, pct int) *progress.Progress {
	now := time.Now()
	return &progress.Progress{
		UserID:     userID,
		ArticleID:  articleID,
		Percentage: pct,
		LastReadAt: now,
		CreatedAt:  now,
		UpdatedAt:  now,
	}
}

func TestProgressRepository_Upsert(t *testing.T) {
	db := setupProgressTestDB(t)
	repo := NewProgressRepository(db)

	t.Run("creates new progress", func(t *testing.T) {
		p := newTestProgress(1, 100, 25)
		err := repo.Upsert(p)
		require.NoError(t, err)

		found, err := repo.FindByUserAndArticle(1, 100)
		require.NoError(t, err)
		require.NotNil(t, found)
		assert.Equal(t, 25, found.Percentage)
	})

	t.Run("updates existing progress on conflict", func(t *testing.T) {
		p := newTestProgress(1, 100, 75)
		err := repo.Upsert(p)
		require.NoError(t, err)

		found, err := repo.FindByUserAndArticle(1, 100)
		require.NoError(t, err)
		require.NotNil(t, found)
		assert.Equal(t, 75, found.Percentage)
	})
}

func TestProgressRepository_FindByUserAndArticle(t *testing.T) {
	db := setupProgressTestDB(t)
	repo := NewProgressRepository(db)

	require.NoError(t, repo.Upsert(newTestProgress(1, 100, 50)))

	t.Run("found", func(t *testing.T) {
		found, err := repo.FindByUserAndArticle(1, 100)
		require.NoError(t, err)
		require.NotNil(t, found)
		assert.Equal(t, 50, found.Percentage)
	})

	t.Run("not found returns nil, nil", func(t *testing.T) {
		found, err := repo.FindByUserAndArticle(1, 999)
		assert.NoError(t, err)
		assert.Nil(t, found)
	})
}

func TestProgressRepository_FindByUser(t *testing.T) {
	db := setupProgressTestDB(t)
	repo := NewProgressRepository(db)

	require.NoError(t, repo.Upsert(newTestProgress(1, 100, 50)))
	require.NoError(t, repo.Upsert(newTestProgress(1, 101, 30)))
	require.NoError(t, repo.Upsert(newTestProgress(2, 100, 80)))

	t.Run("returns user progress with total", func(t *testing.T) {
		list, total, err := repo.FindByUser(1, 10, 0)
		require.NoError(t, err)
		assert.Equal(t, int64(2), total)
		assert.Len(t, list, 2)
	})

	t.Run("respects limit", func(t *testing.T) {
		list, total, err := repo.FindByUser(1, 1, 0)
		require.NoError(t, err)
		assert.Equal(t, int64(2), total)
		assert.Len(t, list, 1)
	})

	t.Run("empty for user without progress", func(t *testing.T) {
		list, total, err := repo.FindByUser(999, 10, 0)
		require.NoError(t, err)
		assert.Equal(t, int64(0), total)
		assert.Empty(t, list)
	})
}
