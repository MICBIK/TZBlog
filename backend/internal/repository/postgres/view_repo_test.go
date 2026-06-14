package postgres

import (
	"testing"
	"time"

	"github.com/MICBIK/TZBlog/backend/internal/domain/view"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupViewTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)

	err = db.Exec(`
		CREATE TABLE views (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			article_id INTEGER NOT NULL,
			user_id INTEGER,
			ip_address VARCHAR(45),
			user_agent VARCHAR(255),
			created_at DATETIME NOT NULL
		)
	`).Error
	require.NoError(t, err)

	return db
}

func newTestView(articleID int64, ip string) *view.View {
	return &view.View{
		ArticleID: articleID,
		IPAddress: ip,
		UserAgent: "test-agent",
		CreatedAt: time.Now(),
	}
}

func TestViewRepository_Create(t *testing.T) {
	db := setupViewTestDB(t)
	repo := NewViewRepository(db)

	v := newTestView(1, "192.168.1.1")
	err := repo.Create(v)
	require.NoError(t, err)
	assert.NotZero(t, v.ID)
}

func TestViewRepository_CountByArticle(t *testing.T) {
	db := setupViewTestDB(t)
	repo := NewViewRepository(db)

	require.NoError(t, repo.Create(newTestView(1, "192.168.1.1")))
	require.NoError(t, repo.Create(newTestView(1, "192.168.1.2")))
	require.NoError(t, repo.Create(newTestView(2, "192.168.1.1")))

	t.Run("counts article views", func(t *testing.T) {
		count, err := repo.CountByArticle(1)
		require.NoError(t, err)
		assert.Equal(t, int64(2), count)
	})

	t.Run("zero for article without views", func(t *testing.T) {
		count, err := repo.CountByArticle(999)
		require.NoError(t, err)
		assert.Equal(t, int64(0), count)
	})
}

func TestViewRepository_CountUnique(t *testing.T) {
	db := setupViewTestDB(t)
	repo := NewViewRepository(db)

	since := time.Now().Add(-1 * time.Hour)

	// Same IP twice + a distinct IP = 2 unique
	require.NoError(t, repo.Create(newTestView(1, "192.168.1.1")))
	require.NoError(t, repo.Create(newTestView(1, "192.168.1.1")))
	require.NoError(t, repo.Create(newTestView(1, "192.168.1.2")))

	t.Run("counts unique IPs since time", func(t *testing.T) {
		count, err := repo.CountUnique(1, since)
		require.NoError(t, err)
		assert.Equal(t, int64(2), count)
	})

	t.Run("excludes views before since", func(t *testing.T) {
		future := time.Now().Add(1 * time.Hour)
		count, err := repo.CountUnique(1, future)
		require.NoError(t, err)
		assert.Equal(t, int64(0), count)
	})
}
