package postgres

import (
	"testing"
	"time"

	"github.com/MICBIK/TZBlog/backend/internal/domain/tag"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupTagTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)

	err = db.Exec(`
		CREATE TABLE tags (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name VARCHAR(100) NOT NULL UNIQUE,
			slug VARCHAR(100) NOT NULL UNIQUE,
			created_at DATETIME NOT NULL,
			updated_at DATETIME NOT NULL,
			deleted_at DATETIME
		)
	`).Error
	require.NoError(t, err)

	err = db.Exec(`
		CREATE TABLE article_tags (
			article_id INTEGER NOT NULL,
			tag_id INTEGER NOT NULL,
			PRIMARY KEY (article_id, tag_id)
		)
	`).Error
	require.NoError(t, err)

	return db
}

func newTestTag(name, slug string) *tag.Tag {
	now := time.Now()
	return &tag.Tag{
		Name:      name,
		Slug:      slug,
		CreatedAt: now,
		UpdatedAt: now,
	}
}

func TestTagRepository_Create(t *testing.T) {
	tests := []struct {
		name      string
		setup     func(repo tag.TagRepository)
		input     *tag.Tag
		expectErr bool
	}{
		{
			name:      "successful create",
			setup:     func(repo tag.TagRepository) {},
			input:     newTestTag("Go", "go"),
			expectErr: false,
		},
		{
			name: "duplicate name fails",
			setup: func(repo tag.TagRepository) {
				_ = repo.Create(newTestTag("Rust", "rust"))
			},
			input:     newTestTag("Rust", "rust-lang"),
			expectErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			db := setupTagTestDB(t)
			repo := NewTagRepository(db)
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

func TestTagRepository_FindByID(t *testing.T) {
	db := setupTagTestDB(t)
	repo := NewTagRepository(db)

	tg := newTestTag("Go", "go")
	require.NoError(t, repo.Create(tg))

	t.Run("found", func(t *testing.T) {
		found, err := repo.FindByID(tg.ID)
		require.NoError(t, err)
		require.NotNil(t, found)
		assert.Equal(t, "Go", found.Name)
	})

	t.Run("not found returns nil, nil", func(t *testing.T) {
		found, err := repo.FindByID(99999)
		assert.NoError(t, err)
		assert.Nil(t, found)
	})
}

func TestTagRepository_FindBySlug(t *testing.T) {
	db := setupTagTestDB(t)
	repo := NewTagRepository(db)

	tg := newTestTag("Go", "go")
	require.NoError(t, repo.Create(tg))

	t.Run("found", func(t *testing.T) {
		found, err := repo.FindBySlug("go")
		require.NoError(t, err)
		require.NotNil(t, found)
		assert.Equal(t, tg.ID, found.ID)
	})

	t.Run("not found returns nil, nil", func(t *testing.T) {
		found, err := repo.FindBySlug("nonexistent")
		assert.NoError(t, err)
		assert.Nil(t, found)
	})
}

func TestTagRepository_List(t *testing.T) {
	db := setupTagTestDB(t)
	repo := NewTagRepository(db)

	for _, name := range []string{"Go", "Rust", "Python", "Java"} {
		require.NoError(t, repo.Create(newTestTag(name, name)))
	}

	t.Run("list all", func(t *testing.T) {
		tags, total, err := repo.List(10, 0)
		require.NoError(t, err)
		assert.Equal(t, int64(4), total)
		assert.Len(t, tags, 4)
	})

	t.Run("list with limit", func(t *testing.T) {
		tags, total, err := repo.List(2, 0)
		require.NoError(t, err)
		assert.Equal(t, int64(4), total)
		assert.Len(t, tags, 2)
	})
}

func TestTagRepository_Update(t *testing.T) {
	db := setupTagTestDB(t)
	repo := NewTagRepository(db)

	tg := newTestTag("Go", "go")
	require.NoError(t, repo.Create(tg))

	tg.Name = "Golang"
	err := repo.Update(tg)
	require.NoError(t, err)

	found, err := repo.FindByID(tg.ID)
	require.NoError(t, err)
	assert.Equal(t, "Golang", found.Name)
}

func TestTagRepository_Delete(t *testing.T) {
	db := setupTagTestDB(t)
	repo := NewTagRepository(db)

	tg := newTestTag("Go", "go")
	require.NoError(t, repo.Create(tg))

	err := repo.Delete(tg.ID)
	require.NoError(t, err)

	found, err := repo.FindByID(tg.ID)
	assert.NoError(t, err)
	assert.Nil(t, found)
}

func TestTagRepository_FindByNames(t *testing.T) {
	db := setupTagTestDB(t)
	repo := NewTagRepository(db)

	for _, name := range []string{"Go", "Rust", "Python"} {
		require.NoError(t, repo.Create(newTestTag(name, name)))
	}

	found, err := repo.FindByNames([]string{"Go", "Python"})
	require.NoError(t, err)
	assert.Len(t, found, 2)
}

func TestTagRepository_FindByArticleID(t *testing.T) {
	db := setupTagTestDB(t)
	repo := NewTagRepository(db)

	t1 := newTestTag("Go", "go")
	t2 := newTestTag("Rust", "rust")
	require.NoError(t, repo.Create(t1))
	require.NoError(t, repo.Create(t2))

	// Link article 1 to both tags
	require.NoError(t, db.Exec("INSERT INTO article_tags (article_id, tag_id) VALUES (1, ?)", t1.ID).Error)
	require.NoError(t, db.Exec("INSERT INTO article_tags (article_id, tag_id) VALUES (1, ?)", t2.ID).Error)

	t.Run("returns tags for article", func(t *testing.T) {
		tags, err := repo.FindByArticleID(1)
		require.NoError(t, err)
		assert.Len(t, tags, 2)
	})

	t.Run("empty for article without tags", func(t *testing.T) {
		tags, err := repo.FindByArticleID(999)
		require.NoError(t, err)
		assert.Empty(t, tags)
	})
}
