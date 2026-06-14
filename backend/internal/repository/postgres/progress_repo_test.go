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
		UserID:     1,
		ArticleID:  1,
		Percentage: 50,
	}

	mock.ExpectBegin()
	mock.ExpectExec(`INSERT INTO "reading_progress"`).
		WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectCommit()

	err := repo.Upsert(prog)
	assert.NoError(t, err)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestProgressRepository_FindByUserAndArticle(t *testing.T) {
	db, mock := setupMockDB(t)
	repo := NewProgressRepository(db)

	rows := sqlmock.NewRows([]string{
		"id", "user_id", "article_id", "percentage",
	}).AddRow(1, 1, 1, 75)

	mock.ExpectQuery(`SELECT .* FROM "reading_progress"`).
		WithArgs(int64(1), int64(1), 1).
		WillReturnRows(rows)

	prog, err := repo.FindByUserAndArticle(1, 1)
	assert.NoError(t, err)
	assert.NotNil(t, prog)
	assert.Equal(t, 75, prog.Percentage)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestProgressRepository_FindByUser(t *testing.T) {
	db, mock := setupMockDB(t)
	repo := NewProgressRepository(db)

	countRows := sqlmock.NewRows([]string{"count"}).AddRow(2)
	mock.ExpectQuery(`SELECT count\(\*\) FROM "reading_progress"`).
		WithArgs(int64(1)).
		WillReturnRows(countRows)

	rows := sqlmock.NewRows([]string{
		"id", "user_id", "article_id", "percentage",
	}).
		AddRow(1, 1, 1, 50).
		AddRow(2, 1, 2, 75)

	mock.ExpectQuery(`SELECT .* FROM "reading_progress"`).
		WithArgs(int64(1)).
		WillReturnRows(rows)

	progs, total, err := repo.FindByUser(1, 10, 0)
	assert.NoError(t, err)
	assert.Len(t, progs, 2)
	assert.Equal(t, int64(2), total)
	assert.NoError(t, mock.ExpectationsWereMet())
}
