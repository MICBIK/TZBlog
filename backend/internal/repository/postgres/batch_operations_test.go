package postgres

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)

	// Auto migrate
	err = db.AutoMigrate(&Article{}, &Author{}, &Tag{})
	require.NoError(t, err)

	// Create article_tags join table
	err = db.Exec(`
		CREATE TABLE IF NOT EXISTS article_tags (
			article_id INTEGER,
			tag_id INTEGER,
			PRIMARY KEY (article_id, tag_id)
		)
	`).Error
	require.NoError(t, err)

	return db
}

func TestBatchInsertArticles(t *testing.T) {
	db := setupTestDB(t)
	batch := NewBatchOperations(db)

	articles := []*Article{
		{Title: "Article 1", Slug: "article-1", Content: "Content 1", AuthorID: 1, Status: "published"},
		{Title: "Article 2", Slug: "article-2", Content: "Content 2", AuthorID: 1, Status: "published"},
		{Title: "Article 3", Slug: "article-3", Content: "Content 3", AuthorID: 1, Status: "draft"},
	}

	err := batch.BatchInsertArticles(context.Background(), articles)
	require.NoError(t, err)

	// Verify insertion
	var count int64
	db.Model(&Article{}).Count(&count)
	assert.Equal(t, int64(3), count)
}

func TestBatchUpdateArticleStatus(t *testing.T) {
	db := setupTestDB(t)
	batch := NewBatchOperations(db)

	// Insert test data
	articles := []*Article{
		{Title: "Article 1", Slug: "article-1", Content: "Content 1", AuthorID: 1, Status: "draft"},
		{Title: "Article 2", Slug: "article-2", Content: "Content 2", AuthorID: 1, Status: "draft"},
	}
	db.Create(&articles)

	// Batch update
	ids := []int64{articles[0].ID, articles[1].ID}
	err := batch.BatchUpdateArticleStatus(context.Background(), ids, "published")
	require.NoError(t, err)

	// Verify update
	var updated []*Article
	db.Where("id IN ?", ids).Find(&updated)
	for _, article := range updated {
		assert.Equal(t, "published", article.Status)
	}
}

func TestBatchDeleteArticles(t *testing.T) {
	db := setupTestDB(t)
	batch := NewBatchOperations(db)

	// Insert test data
	articles := []*Article{
		{Title: "Article 1", Slug: "article-1", Content: "Content 1", AuthorID: 1, Status: "published"},
		{Title: "Article 2", Slug: "article-2", Content: "Content 2", AuthorID: 1, Status: "published"},
	}
	db.Create(&articles)

	// Batch delete
	ids := []int64{articles[0].ID, articles[1].ID}
	err := batch.BatchDeleteArticles(context.Background(), ids)
	require.NoError(t, err)

	// Verify deletion (soft delete)
	var count int64
	db.Model(&Article{}).Where("id IN ?", ids).Count(&count)
	assert.Equal(t, int64(0), count)

	// Verify they exist with Unscoped
	db.Unscoped().Model(&Article{}).Where("id IN ?", ids).Count(&count)
	assert.Equal(t, int64(2), count)
}

func TestBatchIncrementViewCounts(t *testing.T) {
	db := setupTestDB(t)
	batch := NewBatchOperations(db)

	// Insert test data
	articles := []*Article{
		{Title: "Article 1", Slug: "article-1", Content: "Content 1", AuthorID: 1, Status: "published", ViewCount: 10},
		{Title: "Article 2", Slug: "article-2", Content: "Content 2", AuthorID: 1, Status: "published", ViewCount: 20},
	}
	db.Create(&articles)

	// Batch increment
	increments := map[int64]int64{
		articles[0].ID: 5,
		articles[1].ID: 10,
	}
	err := batch.BatchIncrementViewCounts(context.Background(), increments)
	require.NoError(t, err)

	// Verify increments
	var updated []*Article
	db.Where("id IN ?", []int64{articles[0].ID, articles[1].ID}).Find(&updated)
	assert.Equal(t, int64(15), updated[0].ViewCount)
	assert.Equal(t, int64(30), updated[1].ViewCount)
}

func TestUpsertArticleTags(t *testing.T) {
	db := setupTestDB(t)
	batch := NewBatchOperations(db)

	// Insert test data
	article := &Article{Title: "Article 1", Slug: "article-1", Content: "Content 1", AuthorID: 1, Status: "published"}
	db.Create(article)

	tags := []*Tag{
		{Name: "Go", Slug: "go"},
		{Name: "Database", Slug: "database"},
		{Name: "Performance", Slug: "performance"},
	}
	db.Create(&tags)

	// Initial tag assignment
	tagIDs := []int64{tags[0].ID, tags[1].ID}
	err := batch.UpsertArticleTags(context.Background(), article.ID, tagIDs)
	require.NoError(t, err)

	// Verify tags
	var count int64
	db.Table("article_tags").Where("article_id = ?", article.ID).Count(&count)
	assert.Equal(t, int64(2), count)

	// Update tags
	newTagIDs := []int64{tags[1].ID, tags[2].ID}
	err = batch.UpsertArticleTags(context.Background(), article.ID, newTagIDs)
	require.NoError(t, err)

	// Verify updated tags
	db.Table("article_tags").Where("article_id = ?", article.ID).Count(&count)
	assert.Equal(t, int64(2), count)

	// Verify specific tags
	var articleTagIDs []int64
	db.Table("article_tags").Where("article_id = ?", article.ID).Pluck("tag_id", &articleTagIDs)
	assert.Contains(t, articleTagIDs, tags[1].ID)
	assert.Contains(t, articleTagIDs, tags[2].ID)
	assert.NotContains(t, articleTagIDs, tags[0].ID)
}

func TestBulkFetchArticlesByIDs(t *testing.T) {
	db := setupTestDB(t)
	batch := NewBatchOperations(db)

	// Insert test data
	author := &Author{Username: "testuser", Avatar: "avatar.jpg"}
	db.Table("users").Create(author)

	articles := []*Article{
		{Title: "Article 1", Slug: "article-1", Content: "Content 1", AuthorID: author.ID, Status: "published"},
		{Title: "Article 2", Slug: "article-2", Content: "Content 2", AuthorID: author.ID, Status: "published"},
	}
	db.Create(&articles)

	// Bulk fetch
	ids := []int64{articles[0].ID, articles[1].ID}
	fetched, err := batch.BulkFetchArticlesByIDs(context.Background(), ids)
	require.NoError(t, err)

	assert.Equal(t, 2, len(fetched))
	assert.NotNil(t, fetched[0].Author)
	assert.Equal(t, author.Username, fetched[0].Author.Username)
}

func TestOptimizedArticleListQuery(t *testing.T) {
	db := setupTestDB(t)
	batch := NewBatchOperations(db)

	// Insert test data
	author := &Author{Username: "testuser", Avatar: "avatar.jpg"}
	db.Table("users").Create(author)

	articles := []*Article{
		{Title: "Article 1", Slug: "article-1", Content: "Content 1", AuthorID: author.ID, Status: "published"},
		{Title: "Article 2", Slug: "article-2", Content: "Content 2", AuthorID: author.ID, Status: "published"},
		{Title: "Article 3", Slug: "article-3", Content: "Content 3", AuthorID: author.ID, Status: "draft"},
	}
	db.Create(&articles)

	// Query with filters
	filters := ArticleFilters{
		Status:  "published",
		OrderBy: "created_at DESC",
		Limit:   10,
		Offset:  0,
	}

	results, total, err := batch.OptimizedArticleListQuery(context.Background(), filters)
	require.NoError(t, err)

	assert.Equal(t, int64(2), total)
	assert.Equal(t, 2, len(results))
	assert.NotNil(t, results[0].Author)
}

func TestBatchOperations_EmptyInput(t *testing.T) {
	db := setupTestDB(t)
	batch := NewBatchOperations(db)
	ctx := context.Background()

	// Test all batch operations with empty input
	t.Run("BatchInsertArticles", func(t *testing.T) {
		err := batch.BatchInsertArticles(ctx, []*Article{})
		assert.NoError(t, err)
	})

	t.Run("BatchUpdateArticleStatus", func(t *testing.T) {
		err := batch.BatchUpdateArticleStatus(ctx, []int64{}, "published")
		assert.NoError(t, err)
	})

	t.Run("BatchDeleteArticles", func(t *testing.T) {
		err := batch.BatchDeleteArticles(ctx, []int64{})
		assert.NoError(t, err)
	})

	t.Run("BatchIncrementViewCounts", func(t *testing.T) {
		err := batch.BatchIncrementViewCounts(ctx, map[int64]int64{})
		assert.NoError(t, err)
	})

	t.Run("BulkFetchArticlesByIDs", func(t *testing.T) {
		articles, err := batch.BulkFetchArticlesByIDs(ctx, []int64{})
		assert.NoError(t, err)
		assert.Equal(t, 0, len(articles))
	})
}

func BenchmarkBatchInsert(b *testing.B) {
	db := setupTestDB(&testing.T{})
	batch := NewBatchOperations(db)

	articles := make([]*Article, 100)
	for i := 0; i < 100; i++ {
		articles[i] = &Article{
			Title:    "Article",
			Slug:     "article",
			Content:  "Content",
			AuthorID: 1,
			Status:   "published",
		}
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		batch.BatchInsertArticles(context.Background(), articles)
		// Clean up
		db.Exec("DELETE FROM articles")
	}
}

func BenchmarkIndividualInsert(b *testing.B) {
	db := setupTestDB(&testing.T{})

	articles := make([]*Article, 100)
	for i := 0; i < 100; i++ {
		articles[i] = &Article{
			Title:    "Article",
			Slug:     "article",
			Content:  "Content",
			AuthorID: 1,
			Status:   "published",
		}
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		for _, article := range articles {
			db.Create(article)
		}
		// Clean up
		db.Exec("DELETE FROM articles")
	}
}
