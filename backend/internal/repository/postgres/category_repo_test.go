package postgres

import (
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/MICBIK/TZBlog/backend/internal/domain/category"
	"github.com/stretchr/testify/assert"
)

func TestCategoryRepository_Create(t *testing.T) {
	db, mock := setupMockDB(t)
	repo := NewCategoryRepository(db)

	newCategory := &category.Category{
		Name: "Technology",
		Slug: "technology",
	}

	mock.ExpectBegin()
	mock.ExpectQuery(`INSERT INTO "categories"`).
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(1))
	mock.ExpectCommit()

	err := repo.Create(newCategory)
	assert.NoError(t, err)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestCategoryRepository_List(t *testing.T) {
	db, mock := setupMockDB(t)
	repo := NewCategoryRepository(db)

	countRows := sqlmock.NewRows([]string{"count"}).AddRow(2)
	mock.ExpectQuery(`SELECT count\(\*\) FROM "categories"`).
		WillReturnRows(countRows)

	rows := sqlmock.NewRows([]string{
		"id", "name", "slug",
	}).
		AddRow(1, "Technology", "technology").
		AddRow(2, "Science", "science")

	mock.ExpectQuery(`SELECT .* FROM "categories" LIMIT`).
		WillReturnRows(rows)

	categories, total, err := repo.List(10, 0)
	assert.NoError(t, err)
	assert.Len(t, categories, 2)
	assert.Equal(t, int64(2), total)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestCategoryRepository_FindBySlug(t *testing.T) {
	db, mock := setupMockDB(t)
	repo := NewCategoryRepository(db)

	rows := sqlmock.NewRows([]string{
		"id", "name", "slug",
	}).AddRow(1, "Technology", "technology")

	mock.ExpectQuery(`SELECT .* FROM "categories" WHERE slug`).
		WithArgs("technology", 1).
		WillReturnRows(rows)

	cat, err := repo.FindBySlug("technology")
	assert.NoError(t, err)
	assert.NotNil(t, cat)
	assert.Equal(t, "technology", cat.Slug)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestCategoryRepository_Update(t *testing.T) {
	db, mock := setupMockDB(t)
	repo := NewCategoryRepository(db)

	cat := &category.Category{
		ID:   1,
		Name: "Updated Tech",
		Slug: "updated-tech",
	}

	mock.ExpectBegin()
	mock.ExpectExec(`UPDATE "categories"`).
		WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectCommit()

	err := repo.Update(cat)
	assert.NoError(t, err)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestCategoryRepository_Delete(t *testing.T) {
	db, mock := setupMockDB(t)
	repo := NewCategoryRepository(db)

	mock.ExpectBegin()
	mock.ExpectExec(`DELETE FROM "categories"`).
		WithArgs(int64(1)).
		WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectCommit()

	err := repo.Delete(1)
	assert.NoError(t, err)
	assert.NoError(t, mock.ExpectationsWereMet())
}
