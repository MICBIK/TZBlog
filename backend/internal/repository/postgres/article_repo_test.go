package postgres

import (
	"testing"

	"github.com/MICBIK/TZBlog/backend/internal/domain/article"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

// setupArticleTestDB creates an in-memory SQLite DB with articles, article_tags, users, and tags tables.
func setupArticleTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)

	// Create users table for Author preload
	err = db.Exec(`
		CREATE TABLE users (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			username VARCHAR(50) NOT NULL,
			email VARCHAR(100) NOT NULL,
			password_hash VARCHAR(255) NOT NULL,
			avatar VARCHAR(255),
			bio TEXT,
			role VARCHAR(20) DEFAULT 'user',
			status VARCHAR(20) DEFAULT 'active',
			created_at DATETIME NOT NULL,
			updated_at DATETIME NOT NULL,
			deleted_at DATETIME
		)
	`).Error
	require.NoError(t, err)

	// Create tags table for Tags preload
	err = db.Exec(`
		CREATE TABLE tags (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name VARCHAR(50) NOT NULL,
			slug VARCHAR(50) NOT NULL UNIQUE,
			description TEXT,
			article_count INTEGER DEFAULT 0,
			created_at DATETIME NOT NULL,
			updated_at DATETIME NOT NULL,
			deleted_at DATETIME
		)
	`).Error
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

	// Insert a default test user for articles to reference
	err = db.Exec(`
		INSERT INTO users (id, username, email, password_hash, created_at, updated_at)
		VALUES (1, 'testuser', 'test@example.com', 'hashed_password', datetime('now'), datetime('now'))
	`).Error
	require.NoError(t, err)

	// Insert default test user 2
	err = db.Exec(`
		INSERT INTO users (id, username, email, password_hash, created_at, updated_at)
		VALUES (2, 'testuser2', 'test2@example.com', 'hashed_password', datetime('now'), datetime('now'))
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

func TestArticleRepository_FindByID_WithAuthorAndTags(t *testing.T) {
	db := setupArticleTestDB(t)
	repo := NewArticleRepository(db)

	// Insert test tags
	err := db.Exec(`
		INSERT INTO tags (id, name, slug, created_at, updated_at)
		VALUES (1, 'Go', 'go', datetime('now'), datetime('now')),
		       (2, 'Testing', 'testing', datetime('now'), datetime('now'))
	`).Error
	require.NoError(t, err)

	// Create article (uses default testuser with id=1)
	art := newTestArticle("Test Article", "test-article", 1)
	require.NoError(t, repo.Create(art))

	// Attach tags
	require.NoError(t, repo.AttachTags(art.ID, []int64{1, 2}))

	// FindByID should load author and tags
	found, err := repo.FindByID(art.ID)
	require.NoError(t, err)
	require.NotNil(t, found)

	// Check author is loaded
	assert.NotNil(t, found.Author)
	assert.Equal(t, "testuser", found.Author.Username)

	// Check tags are loaded
	assert.NotNil(t, found.Tags)
	assert.Len(t, found.Tags, 2)
}

func TestArticleRepository_FindBySlug_WithAuthorAndTags(t *testing.T) {
	db := setupArticleTestDB(t)
	repo := NewArticleRepository(db)

	// Insert test tags
	err := db.Exec(`
		INSERT INTO tags (id, name, slug, created_at, updated_at)
		VALUES (1, 'Go', 'go', datetime('now'), datetime('now')),
		       (2, 'Testing', 'testing', datetime('now'), datetime('now'))
	`).Error
	require.NoError(t, err)

	// Create article (uses default testuser with id=1)
	art := newTestArticle("Test Article", "test-article", 1)
	require.NoError(t, repo.Create(art))

	// Attach tags
	require.NoError(t, repo.AttachTags(art.ID, []int64{1, 2}))

	// FindBySlug should load author and tags
	found, err := repo.FindBySlug("test-article")
	require.NoError(t, err)
	require.NotNil(t, found)

	// Check author is loaded
	assert.NotNil(t, found.Author)
	assert.Equal(t, "testuser", found.Author.Username)

	// Check tags are loaded
	assert.NotNil(t, found.Tags)
	assert.Len(t, found.Tags, 2)
}

func TestArticleRepository_List_WithMultipleFilters(t *testing.T) {
	db := setupArticleTestDB(t)
	repo := NewArticleRepository(db)

	// Create test articles
	a1 := newTestArticle("Go Tutorial", "go-tutorial", 1)
	a1.Status = article.StatusPublished
	a1.CategoryID = 10
	require.NoError(t, repo.Create(a1))

	a2 := newTestArticle("Go Advanced", "go-advanced", 1)
	a2.Status = article.StatusPublished
	a2.CategoryID = 10
	require.NoError(t, repo.Create(a2))

	a3 := newTestArticle("Python Basics", "python-basics", 2)
	a3.Status = article.StatusPublished
	a3.CategoryID = 20
	require.NoError(t, repo.Create(a3))

	t.Run("filter by status and author", func(t *testing.T) {
		articles, total, err := repo.List(&article.ListFilter{
			Status:   article.StatusPublished,
			AuthorID: 1,
			Page:     1,
			Limit:    10,
		})
		require.NoError(t, err)
		assert.Equal(t, int64(2), total)
		assert.Len(t, articles, 2)
	})

	t.Run("filter by status and category", func(t *testing.T) {
		articles, total, err := repo.List(&article.ListFilter{
			Status:     article.StatusPublished,
			CategoryID: 10,
			Page:       1,
			Limit:      10,
		})
		require.NoError(t, err)
		assert.Equal(t, int64(2), total)
		assert.Len(t, articles, 2)
	})

	t.Run("filter by author, category, and search", func(t *testing.T) {
		articles, total, err := repo.List(&article.ListFilter{
			AuthorID:   1,
			CategoryID: 10,
			Search:     "Advanced",
			Page:       1,
			Limit:      10,
		})
		require.NoError(t, err)
		assert.Equal(t, int64(1), total)
		assert.Len(t, articles, 1)
		assert.Equal(t, "Go Advanced", articles[0].Title)
	})

	t.Run("custom order by", func(t *testing.T) {
		articles, total, err := repo.List(&article.ListFilter{
			OrderBy: "title ASC",
			Page:    1,
			Limit:   10,
		})
		require.NoError(t, err)
		assert.Equal(t, int64(3), total)
		assert.Len(t, articles, 3)
		assert.Equal(t, "Go Advanced", articles[0].Title)
		assert.Equal(t, "Go Tutorial", articles[1].Title)
	})
}

func TestArticleRepository_Update_PartialFields(t *testing.T) {
	db := setupArticleTestDB(t)
	repo := NewArticleRepository(db)

	art := newTestArticle("Original Title", "original-slug", 1)
	require.NoError(t, repo.Create(art))
	originalCreatedAt := art.CreatedAt

	// Update only specific fields
	art.Title = "Updated Title"
	art.Summary = "Updated summary"
	err := repo.Update(art)
	require.NoError(t, err)

	// Verify changes
	found, err := repo.FindByID(art.ID)
	require.NoError(t, err)
	require.NotNil(t, found)
	assert.Equal(t, "Updated Title", found.Title)
	assert.Equal(t, "Updated summary", found.Summary)
	assert.Equal(t, "original-slug", found.Slug) // Unchanged
	assert.Equal(t, originalCreatedAt.Unix(), found.CreatedAt.Unix())
	assert.True(t, found.UpdatedAt.After(originalCreatedAt))
}

func TestArticleRepository_IncrementViewCount_Multiple(t *testing.T) {
	db := setupArticleTestDB(t)
	repo := NewArticleRepository(db)

	art := newTestArticle("Popular Article", "popular", 1)
	require.NoError(t, repo.Create(art))

	// Increment multiple times
	for i := 0; i < 5; i++ {
		err := repo.IncrementViewCount(art.ID)
		require.NoError(t, err)
	}

	found, err := repo.FindByID(art.ID)
	require.NoError(t, err)
	require.NotNil(t, found)
	assert.Equal(t, int64(5), found.ViewCount)
}

func TestArticleRepository_Delete_NonExistent(t *testing.T) {
	db := setupArticleTestDB(t)
	repo := NewArticleRepository(db)

	// Delete non-existent article should not error
	err := repo.Delete(99999)
	assert.NoError(t, err)
}

func TestArticleRepository_IncrementViewCount_NonExistent(t *testing.T) {
	db := setupArticleTestDB(t)
	repo := NewArticleRepository(db)

	// Increment view count for non-existent article
	err := repo.IncrementViewCount(99999)
	assert.NoError(t, err) // GORM doesn't error on 0 rows affected
}

func TestArticleRepository_AttachTags_Duplicate(t *testing.T) {
	db := setupArticleTestDB(t)
	repo := NewArticleRepository(db)

	art := newTestArticle("Tagged Article", "tagged", 1)
	require.NoError(t, repo.Create(art))

	// Attach tags
	err := repo.AttachTags(art.ID, []int64{1, 2})
	require.NoError(t, err)

	// Try to attach duplicate tags - should error due to PRIMARY KEY constraint
	err = repo.AttachTags(art.ID, []int64{1, 2})
	assert.Error(t, err)
}

func TestArticleRepository_DetachTags_NonExistent(t *testing.T) {
	db := setupArticleTestDB(t)
	repo := NewArticleRepository(db)

	// Detach tags from non-existent article
	err := repo.DetachTags(99999)
	assert.NoError(t, err) // Should succeed (0 rows deleted)
}
