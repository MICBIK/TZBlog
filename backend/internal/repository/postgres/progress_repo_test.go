package postgres

import (
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/MICBIK/TZBlog/backend/internal/domain/progress"
	"github.com/stretchr/testify/assert"
)

func TestProgressRepository_Upsert(t *testing.T) {
	db, mock := setupMockDB(t)
	repo := NewProgressRepository(db)

	prog := &progress.Progress{
		UserID:    1,
		ArticleID: 1,
		Progress:  50,
	}

	mock.ExpectBegin()
	mock.ExpectExec(`INSERT INTO "reading_progress"`).
		WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectCommit()

	err := repo.Upsert(prog)
	assert.NoError(t, err)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestProgressRepository_Get(t *testing.T) {
	db, mock := setupMockDB(t)
	repo := NewProgressRepository(db)

	rows := sqlmock.NewRows([]string{
		"id", "user_id", "article_id", "progress",
	}).AddRow(1, 1, 1, 75)

	mock.ExpectQuery(`SELECT .* FROM "reading_progress"`).
		WithArgs(int64(1), int64(1), 1).
		WillReturnRows(rows)

	prog, err := repo.Get(1, 1)
	assert.NoError(t, err)
	assert.NotNil(t, prog)
	assert.Equal(t, 75, prog.Progress)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestProgressRepository_GetByUser(t *testing.T) {
	db, mock := setupMockDB(t)
	repo := NewProgressRepository(db)

	rows := sqlmock.NewRows([]string{
		"id", "user_id", "article_id", "progress",
	}).
		AddRow(1, 1, 1, 50).
		AddRow(2, 1, 2, 75)

	mock.ExpectQuery(`SELECT .* FROM "reading_progress"`).
		WithArgs(int64(1)).
		WillReturnRows(rows)

	progs, err := repo.GetByUser(1)
	assert.NoError(t, err)
	assert.Len(t, progs, 2)
	assert.NoError(t, mock.ExpectationsWereMet())
}
