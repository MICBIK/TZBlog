package postgres

import (
	"testing"
	"time"

	"github.com/MICBIK/TZBlog/backend/internal/domain/comment"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

// setupCommentTestDB creates an in-memory SQLite DB with the comments table.
func setupCommentTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)

	err = db.Exec(`
		CREATE TABLE comments (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			article_id INTEGER NOT NULL,
			user_id INTEGER NOT NULL,
			parent_id INTEGER,
			content TEXT NOT NULL,
			status VARCHAR(20) DEFAULT 'published',
			created_at DATETIME NOT NULL,
			updated_at DATETIME NOT NULL,
			deleted_at DATETIME
		)
	`).Error
	require.NoError(t, err)

	return db
}

// newTestComment returns a valid comment for insertion.
func newTestComment(articleID, userID int64, content string) *comment.Comment {
	now := time.Now()
	return &comment.Comment{
		ArticleID: articleID,
		UserID:    userID,
		Content:   content,
		Status:    "published",
		CreatedAt: now,
		UpdatedAt: now,
	}
}

func TestCommentRepository_Create(t *testing.T) {
	tests := []struct {
		name      string
		input     *comment.Comment
		expectErr bool
	}{
		{
			name:      "successful create",
			input:     newTestComment(1, 100, "Great article!"),
			expectErr: false,
		},
		{
			name: "create with parent comment",
			input: func() *comment.Comment {
				c := newTestComment(1, 100, "Reply")
				parentID := int64(5)
				c.ParentID = &parentID
				return c
			}(),
			expectErr: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			db := setupCommentTestDB(t)
			repo := NewCommentRepository(db)

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

func TestCommentRepository_FindByID(t *testing.T) {
	db := setupCommentTestDB(t)
	repo := NewCommentRepository(db)

	c := newTestComment(1, 100, "Great article!")
	require.NoError(t, repo.Create(c))

	t.Run("found", func(t *testing.T) {
		found, err := repo.FindByID(c.ID)
		require.NoError(t, err)
		require.NotNil(t, found)
		assert.Equal(t, c.Content, found.Content)
		assert.Equal(t, c.ArticleID, found.ArticleID)
	})

	t.Run("not found returns nil, nil", func(t *testing.T) {
		found, err := repo.FindByID(99999)
		assert.NoError(t, err)
		assert.Nil(t, found)
	})
}

func TestCommentRepository_FindByArticleID(t *testing.T) {
	db := setupCommentTestDB(t)
	repo := NewCommentRepository(db)

	// Article 1 has 3 comments, article 2 has 1
	require.NoError(t, repo.Create(newTestComment(1, 100, "Comment 1")))
	require.NoError(t, repo.Create(newTestComment(1, 101, "Comment 2")))
	require.NoError(t, repo.Create(newTestComment(1, 102, "Comment 3")))
	require.NoError(t, repo.Create(newTestComment(2, 100, "Other article comment")))

	t.Run("returns article comments with total", func(t *testing.T) {
		comments, total, err := repo.FindByArticleID(1, 10, 0)
		require.NoError(t, err)
		assert.Equal(t, int64(3), total)
		assert.Len(t, comments, 3)
	})

	t.Run("respects limit", func(t *testing.T) {
		comments, total, err := repo.FindByArticleID(1, 2, 0)
		require.NoError(t, err)
		assert.Equal(t, int64(3), total)
		assert.Len(t, comments, 2)
	})

	t.Run("respects offset", func(t *testing.T) {
		comments, total, err := repo.FindByArticleID(1, 10, 2)
		require.NoError(t, err)
		assert.Equal(t, int64(3), total)
		assert.Len(t, comments, 1)
	})

	t.Run("no comments returns empty", func(t *testing.T) {
		comments, total, err := repo.FindByArticleID(999, 10, 0)
		require.NoError(t, err)
		assert.Equal(t, int64(0), total)
		assert.Empty(t, comments)
	})
}

func TestCommentRepository_List(t *testing.T) {
	db := setupCommentTestDB(t)
	repo := NewCommentRepository(db)

	require.NoError(t, repo.Create(newTestComment(1, 100, "Comment 1")))
	require.NoError(t, repo.Create(newTestComment(1, 101, "Comment 2")))
	require.NoError(t, repo.Create(newTestComment(2, 100, "Comment 3")))

	t.Run("filter by article", func(t *testing.T) {
		comments, total, err := repo.List(&comment.ListFilter{ArticleID: 1, Limit: 10})
		require.NoError(t, err)
		assert.Equal(t, int64(2), total)
		assert.Len(t, comments, 2)
	})

	t.Run("filter by user", func(t *testing.T) {
		comments, total, err := repo.List(&comment.ListFilter{UserID: 100, Limit: 10})
		require.NoError(t, err)
		assert.Equal(t, int64(2), total)
		assert.Len(t, comments, 2)
	})

	t.Run("filter by status", func(t *testing.T) {
		comments, total, err := repo.List(&comment.ListFilter{Status: "published", Limit: 10})
		require.NoError(t, err)
		assert.Equal(t, int64(3), total)
		assert.Len(t, comments, 3)
	})

	t.Run("no filter returns all", func(t *testing.T) {
		comments, total, err := repo.List(&comment.ListFilter{Limit: 10})
		require.NoError(t, err)
		assert.Equal(t, int64(3), total)
		assert.Len(t, comments, 3)
	})
}

func TestCommentRepository_Update(t *testing.T) {
	db := setupCommentTestDB(t)
	repo := NewCommentRepository(db)

	c := newTestComment(1, 100, "Original content")
	require.NoError(t, repo.Create(c))

	c.Content = "Updated content"
	err := repo.Update(c)
	require.NoError(t, err)

	found, err := repo.FindByID(c.ID)
	require.NoError(t, err)
	require.NotNil(t, found)
	assert.Equal(t, "Updated content", found.Content)
}

func TestCommentRepository_Delete(t *testing.T) {
	db := setupCommentTestDB(t)
	repo := NewCommentRepository(db)

	c := newTestComment(1, 100, "To be deleted")
	require.NoError(t, repo.Create(c))

	err := repo.Delete(c.ID)
	require.NoError(t, err)

	found, err := repo.FindByID(c.ID)
	assert.NoError(t, err)
	assert.Nil(t, found)
}

func TestCommentRepository_CountByArticleID(t *testing.T) {
	db := setupCommentTestDB(t)
	repo := NewCommentRepository(db)

	require.NoError(t, repo.Create(newTestComment(1, 100, "Comment 1")))
	require.NoError(t, repo.Create(newTestComment(1, 101, "Comment 2")))
	require.NoError(t, repo.Create(newTestComment(2, 100, "Comment 3")))

	t.Run("counts comments for article", func(t *testing.T) {
		count, err := repo.CountByArticleID(1)
		require.NoError(t, err)
		assert.Equal(t, int64(2), count)
	})

	t.Run("zero for article without comments", func(t *testing.T) {
		count, err := repo.CountByArticleID(999)
		require.NoError(t, err)
		assert.Equal(t, int64(0), count)
	})
}
