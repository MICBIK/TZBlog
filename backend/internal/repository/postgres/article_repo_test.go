package postgres

import (
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/stretchr/testify/assert"
)

func TestArticleRepository_FindAll_NoN1Problem(t *testing.T) {
	db, mock := setupMockDB(t)
	repo := NewArticleRepository(db)

	// Mock COUNT query
	mock.ExpectQuery(`SELECT count\(\*\) FROM "articles"`).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(2))

	// Mock main articles query
	articleRows := sqlmock.NewRows([]string{
		"id", "title", "slug", "content", "author_id", "status",
		"view_count", "like_count", "reading_time", "created_at", "updated_at",
	}).
		AddRow(1, "Article 1", "article-1", "Content 1", 1, "published", 100, 10, 5, 1234567890, 1234567890).
		AddRow(2, "Article 2", "article-2", "Content 2", 2, "published", 200, 20, 10, 1234567891, 1234567891)

	mock.ExpectQuery(`SELECT .* FROM "articles"`).
		WillReturnRows(articleRows)

	// Mock Author preload - SINGLE query for all authors
	authorRows := sqlmock.NewRows([]string{"id", "username", "avatar"}).
		AddRow(1, "author1", "avatar1.jpg").
		AddRow(2, "author2", "avatar2.jpg")

	mock.ExpectQuery(`SELECT .* FROM "users" WHERE "users"\."id" IN`).
		WillReturnRows(authorRows)

	// Mock article_tags join table query (GORM queries this first for many2many)
	articleTagRows := sqlmock.NewRows([]string{"article_id", "tag_id"}).
		AddRow(1, 1).
		AddRow(2, 2)

	mock.ExpectQuery(`SELECT .* FROM "article_tags" WHERE "article_tags"\."article_id" IN`).
		WillReturnRows(articleTagRows)

	// Mock Tags query based on the tag IDs from article_tags
	tagRows := sqlmock.NewRows([]string{"id", "name", "slug"}).
		AddRow(1, "Go", "go").
		AddRow(2, "Performance", "performance")

	mock.ExpectQuery(`SELECT .* FROM "tags" WHERE "tags"\."id" IN`).
		WillReturnRows(tagRows)

	// Execute the query
	articles, total, err := repo.FindAll(10, 0, "published")

	// Assertions
	assert.NoError(t, err)
	assert.Equal(t, int64(2), total)
	assert.Len(t, articles, 2)

	// Verify only 5 queries were executed (not 1 + N + N):
	// 1. COUNT query
	// 2. Main articles query
	// 3. Batch author query (not N queries)
	// 4. Batch article_tags query (for many2many)
	// 5. Batch tags query (not N queries)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestArticleRepository_FindByID(t *testing.T) {
	db, mock := setupMockDB(t)
	repo := NewArticleRepository(db)

	// Mock main article query - GORM First() includes LIMIT
	articleRows := sqlmock.NewRows([]string{
		"id", "title", "slug", "content", "author_id", "status",
		"view_count", "like_count", "reading_time", "created_at", "updated_at",
	}).
		AddRow(1, "Test Article", "test-article", "Content", 1, "published", 100, 10, 5, 1234567890, 1234567890)

	mock.ExpectQuery(`SELECT .* FROM "articles" WHERE "articles"\."id" = .* AND "articles"\."deleted_at" IS NULL ORDER BY`).
		WithArgs(int64(1), 1). // GORM adds LIMIT 1 as the second argument
		WillReturnRows(articleRows)

	// Mock Author preload
	authorRows := sqlmock.NewRows([]string{"id", "username", "avatar"}).
		AddRow(1, "testauthor", "avatar.jpg")

	mock.ExpectQuery(`SELECT .* FROM "users" WHERE "users"\."id" = .*`).
		WithArgs(int64(1)).
		WillReturnRows(authorRows)

	// Mock article_tags join table query
	articleTagRows := sqlmock.NewRows([]string{"article_id", "tag_id"}).
		AddRow(1, 1)

	mock.ExpectQuery(`SELECT .* FROM "article_tags" WHERE "article_tags"\."article_id" = .*`).
		WithArgs(int64(1)).
		WillReturnRows(articleTagRows)

	// Mock Tags query
	tagRows := sqlmock.NewRows([]string{"id", "name", "slug"}).
		AddRow(1, "Go", "go")

	mock.ExpectQuery(`SELECT .* FROM "tags" WHERE "tags"\."id" IN .*`).
		WithArgs(int64(1)).
		WillReturnRows(tagRows)

	article, err := repo.FindByID(1)

	assert.NoError(t, err)
	assert.NotNil(t, article)
	assert.Equal(t, int64(1), article.ID)
	assert.Equal(t, "Test Article", article.Title)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestArticleRepository_FindBySlug(t *testing.T) {
	db, mock := setupMockDB(t)
	repo := NewArticleRepository(db)

	articleRows := sqlmock.NewRows([]string{
		"id", "title", "slug", "content", "author_id", "status",
		"view_count", "like_count", "reading_time", "created_at", "updated_at",
	}).
		AddRow(1, "Test Article", "test-article", "Content", 1, "published", 100, 10, 5, 1234567890, 1234567890)

	mock.ExpectQuery(`SELECT .* FROM "articles" WHERE slug = .* ORDER BY`).
		WithArgs("test-article").
		WillReturnRows(articleRows)

	mock.ExpectQuery(`SELECT .* FROM "users"`).
		WillReturnRows(sqlmock.NewRows([]string{"id", "username", "avatar"}).
			AddRow(1, "testauthor", "avatar.jpg"))

	mock.ExpectQuery(`SELECT .* FROM "tags"`).
		WillReturnRows(sqlmock.NewRows([]string{"id", "name", "slug"}))

	article, err := repo.FindBySlug("test-article")

	assert.NoError(t, err)
	assert.NotNil(t, article)
	assert.Equal(t, "test-article", article.Slug)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestArticleRepository_IncrementViewCount(t *testing.T) {
	db, mock := setupMockDB(t)
	repo := NewArticleRepository(db)

	mock.ExpectExec(`UPDATE "articles" SET "view_count"=view_count \+ .* WHERE id = .*`).
		WithArgs(1, 1).
		WillReturnResult(sqlmock.NewResult(1, 1))

	err := repo.IncrementViewCount(1)

	assert.NoError(t, err)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestArticleRepository_IncrementLikeCount(t *testing.T) {
	db, mock := setupMockDB(t)
	repo := NewArticleRepository(db)

	mock.ExpectExec(`UPDATE "articles" SET "like_count"=like_count \+ .* WHERE id = .*`).
		WithArgs(1, 1).
		WillReturnResult(sqlmock.NewResult(1, 1))

	err := repo.IncrementLikeCount(1)

	assert.NoError(t, err)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestArticleRepository_DecrementLikeCount(t *testing.T) {
	db, mock := setupMockDB(t)
	repo := NewArticleRepository(db)

	mock.ExpectExec(`UPDATE "articles" SET "like_count"=like_count - .* WHERE id = .* AND like_count > .*`).
		WithArgs(1, 1, 0).
		WillReturnResult(sqlmock.NewResult(1, 1))

	err := repo.DecrementLikeCount(1)

	assert.NoError(t, err)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestArticleRepository_Create(t *testing.T) {
	db, mock := setupMockDB(t)
	repo := NewArticleRepository(db)

	article := &Article{
		Title:    "New Article",
		Slug:     "new-article",
		Content:  "Content",
		AuthorID: 1,
		Status:   "draft",
	}

	mock.ExpectBegin()
	mock.ExpectQuery(`INSERT INTO "articles"`).
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(1))
	mock.ExpectCommit()

	err := repo.Create(article)

	assert.NoError(t, err)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestArticleRepository_Delete(t *testing.T) {
	db, mock := setupMockDB(t)
	repo := NewArticleRepository(db)

	mock.ExpectBegin()
	mock.ExpectExec(`UPDATE "articles" SET "deleted_at"=.* WHERE "articles"\."id" = .*`).
		WithArgs(sqlmock.AnyArg(), 1).
		WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectCommit()

	err := repo.Delete(1)

	assert.NoError(t, err)
	assert.NoError(t, mock.ExpectationsWereMet())
}
