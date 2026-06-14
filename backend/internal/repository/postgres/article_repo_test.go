package postgres

import (
	"testing"

	"github.com/MICBIK/TZBlog/backend/internal/domain/article"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

// setupArticleTestDB creates an in-memory SQLite DB with articles and article_tags tables.
func setupArticleTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)

	err = db.Exec(`
		CREATE TABLE articles (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			title VARCHAR(200) NOT NULL,
			slug VARCHAR(255) NOT NULL UNIQUE,
			content TEXT,
			summary VARCHAR(500),
			cover_image VARCHAR(255),
			author_id INTEGER NOT NULL,
			category_id INTEGER,
			status VARCHAR(20) DEFAULT 'draft',
			is_premium BOOLEAN DEFAULT 0,
			reading_time INTEGER DEFAULT 0,
			view_count INTEGER DEFAULT 0,
			like_count INTEGER DEFAULT 0,
			comment_count INTEGER DEFAULT 0,
			published_at DATETIME,
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

// newTestArticle returns a valid article for insertion.
func newTestArticle(title, slug string, authorID int64) *article.Article {
	return &article.Article{
		Title:      title,
		Slug:       slug,
		Content:    "Test content for " + title,
		Summary:    "Summary",
		AuthorID:   authorID,
		CategoryID: 1,
		Status:     article.StatusPublished,
	}
}

func TestArticleRepository_Create(t *testing.T) {
	tests := []struct {
		name      string
		setup     func(repo article.Repository)
		input     *article.Article
		expectErr bool
	}{
		{
			name:      "successful create",
			setup:     func(repo article.Repository) {},
			input:     newTestArticle("First Post", "first-post", 1),
			expectErr: false,
		},
		{
			name: "duplicate slug fails",
			setup: func(repo article.Repository) {
				_ = repo.Create(newTestArticle("Original", "dup-slug", 1))
			},
			input:     newTestArticle("Another", "dup-slug", 1),
			expectErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			db := setupArticleTestDB(t)
			repo := NewArticleRepository(db)
			tt.setup(repo)

			err := repo.Create(tt.input)

			if tt.expectErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
				assert.NotZero(t, tt.input.ID)
				assert.False(t, tt.input.CreatedAt.IsZero())
			}
		})
	}
}

func TestArticleRepository_FindByID(t *testing.T) {
	db := setupArticleTestDB(t)
	repo := NewArticleRepository(db)

	art := newTestArticle("Test Article", "test-article", 1)
	require.NoError(t, repo.Create(art))

	t.Run("found", func(t *testing.T) {
		found, err := repo.FindByID(art.ID)
		require.NoError(t, err)
		require.NotNil(t, found)
		assert.Equal(t, art.Title, found.Title)
		assert.Equal(t, art.Slug, found.Slug)
	})

	t.Run("not found returns nil, nil", func(t *testing.T) {
		found, err := repo.FindByID(99999)
		assert.NoError(t, err)
		assert.Nil(t, found)
	})
}

func TestArticleRepository_FindBySlug(t *testing.T) {
	db := setupArticleTestDB(t)
	repo := NewArticleRepository(db)

	art := newTestArticle("Test Article", "test-article", 1)
	require.NoError(t, repo.Create(art))

	t.Run("found", func(t *testing.T) {
		found, err := repo.FindBySlug("test-article")
		require.NoError(t, err)
		require.NotNil(t, found)
		assert.Equal(t, art.ID, found.ID)
	})

	t.Run("not found returns nil, nil", func(t *testing.T) {
		found, err := repo.FindBySlug("nonexistent")
		assert.NoError(t, err)
		assert.Nil(t, found)
	})
}

func TestArticleRepository_List(t *testing.T) {
	db := setupArticleTestDB(t)
	repo := NewArticleRepository(db)

	// Seed articles with different attributes
	a1 := newTestArticle("Go Tutorial", "go-tutorial", 1)
	a1.Status = article.StatusPublished
	a1.CategoryID = 10
	require.NoError(t, repo.Create(a1))

	a2 := newTestArticle("Rust Guide", "rust-guide", 1)
	a2.Status = article.StatusDraft
	a2.CategoryID = 10
	require.NoError(t, repo.Create(a2))

	a3 := newTestArticle("Python Basics", "python-basics", 2)
	a3.Status = article.StatusPublished
	a3.CategoryID = 20
	require.NoError(t, repo.Create(a3))

	t.Run("list all", func(t *testing.T) {
		articles, total, err := repo.List(&article.ListFilter{Page: 1, Limit: 10})
		require.NoError(t, err)
		assert.Equal(t, int64(3), total)
		assert.Len(t, articles, 3)
	})

	t.Run("filter by status", func(t *testing.T) {
		articles, total, err := repo.List(&article.ListFilter{Status: article.StatusPublished, Page: 1, Limit: 10})
		require.NoError(t, err)
		assert.Equal(t, int64(2), total)
		assert.Len(t, articles, 2)
	})

	t.Run("filter by author", func(t *testing.T) {
		articles, total, err := repo.List(&article.ListFilter{AuthorID: 1, Page: 1, Limit: 10})
		require.NoError(t, err)
		assert.Equal(t, int64(2), total)
		assert.Len(t, articles, 2)
	})

	t.Run("filter by category", func(t *testing.T) {
		articles, total, err := repo.List(&article.ListFilter{CategoryID: 20, Page: 1, Limit: 10})
		require.NoError(t, err)
		assert.Equal(t, int64(1), total)
		assert.Len(t, articles, 1)
	})

	t.Run("search by title", func(t *testing.T) {
		articles, total, err := repo.List(&article.ListFilter{Search: "Go", Page: 1, Limit: 10})
		require.NoError(t, err)
		assert.Equal(t, int64(1), total)
		assert.Len(t, articles, 1)
		assert.Equal(t, "Go Tutorial", articles[0].Title)
	})

	t.Run("pagination limit", func(t *testing.T) {
		articles, total, err := repo.List(&article.ListFilter{Page: 1, Limit: 2})
		require.NoError(t, err)
		assert.Equal(t, int64(3), total)
		assert.Len(t, articles, 2)
	})

	t.Run("pagination offset via page", func(t *testing.T) {
		articles, total, err := repo.List(&article.ListFilter{Page: 2, Limit: 2})
		require.NoError(t, err)
		assert.Equal(t, int64(3), total)
		assert.Len(t, articles, 1)
	})
}

func TestArticleRepository_Update(t *testing.T) {
	db := setupArticleTestDB(t)
	repo := NewArticleRepository(db)

	art := newTestArticle("Original Title", "original-slug", 1)
	require.NoError(t, repo.Create(art))

	art.Title = "Updated Title"
	art.Content = "Updated content"
	err := repo.Update(art)
	require.NoError(t, err)

	found, err := repo.FindByID(art.ID)
	require.NoError(t, err)
	require.NotNil(t, found)
	assert.Equal(t, "Updated Title", found.Title)
	assert.Equal(t, "Updated content", found.Content)
}

func TestArticleRepository_Delete(t *testing.T) {
	db := setupArticleTestDB(t)
	repo := NewArticleRepository(db)

	art := newTestArticle("To Delete", "to-delete", 1)
	require.NoError(t, repo.Create(art))

	err := repo.Delete(art.ID)
	require.NoError(t, err)

	found, err := repo.FindByID(art.ID)
	assert.NoError(t, err)
	assert.Nil(t, found)
}

func TestArticleRepository_IncrementViewCount(t *testing.T) {
	db := setupArticleTestDB(t)
	repo := NewArticleRepository(db)

	art := newTestArticle("Viewed Article", "viewed-article", 1)
	require.NoError(t, repo.Create(art))
	assert.Equal(t, int64(0), art.ViewCount)

	err := repo.IncrementViewCount(art.ID)
	require.NoError(t, err)
	err = repo.IncrementViewCount(art.ID)
	require.NoError(t, err)

	found, err := repo.FindByID(art.ID)
	require.NoError(t, err)
	require.NotNil(t, found)
	assert.Equal(t, int64(2), found.ViewCount)
}

func TestArticleRepository_AttachAndDetachTags(t *testing.T) {
	db := setupArticleTestDB(t)
	repo := NewArticleRepository(db)

	art := newTestArticle("Tagged Article", "tagged-article", 1)
	require.NoError(t, repo.Create(art))

	t.Run("attach tags", func(t *testing.T) {
		err := repo.AttachTags(art.ID, []int64{1, 2, 3})
		require.NoError(t, err)

		var count int64
		db.Table("article_tags").Where("article_id = ?", art.ID).Count(&count)
		assert.Equal(t, int64(3), count)
	})

	t.Run("attach empty tags is no-op", func(t *testing.T) {
		err := repo.AttachTags(art.ID, []int64{})
		assert.NoError(t, err)
	})

	t.Run("detach tags", func(t *testing.T) {
		err := repo.DetachTags(art.ID)
		require.NoError(t, err)

		var count int64
		db.Table("article_tags").Where("article_id = ?", art.ID).Count(&count)
		assert.Equal(t, int64(0), count)
	})
}
