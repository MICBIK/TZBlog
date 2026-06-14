package postgres

import (
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/MICBIK/TZBlog/backend/internal/domain/article"
	"github.com/stretchr/testify/assert"
)

func TestArticleRepository_Create(t *testing.T) {
	db, mock := setupMockDB(t)
	repo := NewArticleRepository(db)

	newArticle := &article.Article{
		AuthorID: 1,
		Title:    "Test Article",
		Slug:     "test-article",
		Content:  "Test content",
		Status:   "draft",
	}

	mock.ExpectBegin()
	mock.ExpectQuery(`INSERT INTO "articles"`).
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(1))
	mock.ExpectCommit()

	err := repo.Create(newArticle)
	assert.NoError(t, err)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestArticleRepository_FindBySlug(t *testing.T) {
	db, mock := setupMockDB(t)
	repo := NewArticleRepository(db)

	slug := "test-article"

	// Mock article query
	articleRows := sqlmock.NewRows([]string{
		"id", "author_id", "title", "slug", "content", "status",
	}).AddRow(1, 1, "Test Article", slug, "Content", "published")

	mock.ExpectQuery(`SELECT .* FROM "articles"`).
		WithArgs(slug, 1).
		WillReturnRows(articleRows)

	// Mock author preload
	authorRows := sqlmock.NewRows([]string{
		"id", "username", "display_name",
	}).AddRow(1, "testuser", "Test User")

	mock.ExpectQuery(`SELECT .* FROM "users"`).
		WillReturnRows(authorRows)

	// Mock tags preload
	mock.ExpectQuery(`SELECT .* FROM "tags"`).
		WillReturnRows(sqlmock.NewRows([]string{}))

	result, err := repo.FindBySlug(slug)
	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, slug, result.Slug)
}

func TestArticleRepository_List(t *testing.T) {
	db, mock := setupMockDB(t)
	repo := NewArticleRepository(db)

	filter := &article.ListFilter{
		Page:   1,
		Limit:  10,
		Status: "published",
	}

	// Mock count query
	mock.ExpectQuery(`SELECT count\(\*\) FROM "articles"`).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(5))

	// Mock list query
	rows := sqlmock.NewRows([]string{
		"id", "title", "slug", "status",
	}).
		AddRow(1, "Article 1", "article-1", "published").
		AddRow(2, "Article 2", "article-2", "published")

	mock.ExpectQuery(`SELECT .* FROM "articles"`).
		WillReturnRows(rows)

	// Mock author preload
	mock.ExpectQuery(`SELECT .* FROM "users"`).
		WillReturnRows(sqlmock.NewRows([]string{}))

	// Mock tags preload
	mock.ExpectQuery(`SELECT .* FROM "tags"`).
		WillReturnRows(sqlmock.NewRows([]string{}))

	articles, total, err := repo.List(filter)
	assert.NoError(t, err)
	assert.Equal(t, int64(5), total)
	assert.Len(t, articles, 2)
}

func TestArticleRepository_Delete(t *testing.T) {
	db, mock := setupMockDB(t)
	repo := NewArticleRepository(db)

	articleID := int64(123)

	mock.ExpectBegin()
	mock.ExpectExec(`UPDATE "articles" SET "deleted_at"`).
		WithArgs(sqlmock.AnyArg(), articleID).
		WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectCommit()

	err := repo.Delete(articleID)
	assert.NoError(t, err)
	assert.NoError(t, mock.ExpectationsWereMet())
}
