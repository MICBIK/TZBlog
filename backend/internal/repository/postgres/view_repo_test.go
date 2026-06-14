package postgres

import (
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/MICBIK/TZBlog/backend/internal/domain/view"
	"github.com/stretchr/testify/assert"
)

func TestViewRepository_Create(t *testing.T) {
	db, mock := setupMockDB(t)
	repo := NewViewRepository(db)

	newView := &view.View{
		ArticleID: 1,
		UserID:    func() *int64 { id := int64(1); return &id }(),
		IPAddress: "127.0.0.1",
	}

	mock.ExpectBegin()
	mock.ExpectQuery(`INSERT INTO "views"`).
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(1))
	mock.ExpectCommit()

	err := repo.Create(newView)
	assert.NoError(t, err)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestViewRepository_CountByArticle(t *testing.T) {
	db, mock := setupMockDB(t)
	repo := NewViewRepository(db)

	rows := sqlmock.NewRows([]string{"count"}).AddRow(100)

	mock.ExpectQuery(`SELECT count\(\*\) FROM "views"`).
		WithArgs(int64(1)).
		WillReturnRows(rows)

	count, err := repo.CountByArticle(1)
	assert.NoError(t, err)
	assert.Equal(t, int64(100), count)
	assert.NoError(t, mock.ExpectationsWereMet())
}
