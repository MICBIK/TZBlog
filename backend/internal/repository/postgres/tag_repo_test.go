package postgres

import (
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/MICBIK/TZBlog/backend/internal/domain/tag"
	"github.com/stretchr/testify/assert"
)

func TestTagRepository_Create(t *testing.T) {
	db, mock := setupMockDB(t)
	repo := NewTagRepository(db)

	newTag := &tag.Tag{
		Name: "Go",
		Slug: "go",
	}

	mock.ExpectBegin()
	mock.ExpectQuery(`INSERT INTO "tags"`).
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(1))
	mock.ExpectCommit()

	err := repo.Create(newTag)
	assert.NoError(t, err)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestTagRepository_List(t *testing.T) {
	db, mock := setupMockDB(t)
	repo := NewTagRepository(db)

	countRows := sqlmock.NewRows([]string{"count"}).AddRow(2)
	mock.ExpectQuery(`SELECT count\(\*\) FROM "tags"`).
		WillReturnRows(countRows)

	rows := sqlmock.NewRows([]string{
		"id", "name", "slug",
	}).
		AddRow(1, "Go", "go").
		AddRow(2, "Python", "python")

	mock.ExpectQuery(`SELECT .* FROM "tags" LIMIT`).
		WillReturnRows(rows)

	tags, total, err := repo.List(10, 0)
	assert.NoError(t, err)
	assert.Len(t, tags, 2)
	assert.Equal(t, int64(2), total)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestTagRepository_FindBySlug(t *testing.T) {
	db, mock := setupMockDB(t)
	repo := NewTagRepository(db)

	rows := sqlmock.NewRows([]string{
		"id", "name", "slug",
	}).AddRow(1, "Go", "go")

	mock.ExpectQuery(`SELECT .* FROM "tags" WHERE slug`).
		WithArgs("go", 1).
		WillReturnRows(rows)

	tag, err := repo.FindBySlug("go")
	assert.NoError(t, err)
	assert.NotNil(t, tag)
	assert.Equal(t, "go", tag.Slug)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestTagRepository_Delete(t *testing.T) {
	db, mock := setupMockDB(t)
	repo := NewTagRepository(db)

	mock.ExpectBegin()
	mock.ExpectExec(`DELETE FROM "tags"`).
		WithArgs(int64(1)).
		WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectCommit()

	err := repo.Delete(1)
	assert.NoError(t, err)
	assert.NoError(t, mock.ExpectationsWereMet())
}
