package postgres

import (
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/stretchr/testify/assert"
)

func TestStatsRepository_GetTotalArticles(t *testing.T) {
	db, mock := setupMockDB(t)
	repo := NewStatsRepository(db)

	rows := sqlmock.NewRows([]string{"count"}).AddRow(42)

	mock.ExpectQuery(`SELECT count\(\*\) FROM "articles"`).
		WillReturnRows(rows)

	count, err := repo.GetTotalArticles()
	assert.NoError(t, err)
	assert.Equal(t, int64(42), count)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestStatsRepository_GetTotalViews(t *testing.T) {
	db, mock := setupMockDB(t)
	repo := NewStatsRepository(db)

	rows := sqlmock.NewRows([]string{"sum"}).AddRow(1000)

	mock.ExpectQuery(`SELECT COALESCE\(SUM\(view_count\), 0\) FROM "articles"`).
		WillReturnRows(rows)

	count, err := repo.GetTotalViews()
	assert.NoError(t, err)
	assert.Equal(t, int64(1000), count)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestStatsRepository_GetTotalComments(t *testing.T) {
	db, mock := setupMockDB(t)
	repo := NewStatsRepository(db)

	rows := sqlmock.NewRows([]string{"count"}).AddRow(150)

	mock.ExpectQuery(`SELECT count\(\*\) FROM "comments"`).
		WillReturnRows(rows)

	count, err := repo.GetTotalComments()
	assert.NoError(t, err)
	assert.Equal(t, int64(150), count)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestStatsRepository_GetTotalLikes(t *testing.T) {
	db, mock := setupMockDB(t)
	repo := NewStatsRepository(db)

	rows := sqlmock.NewRows([]string{"sum"}).AddRow(500)

	mock.ExpectQuery(`SELECT COALESCE\(SUM\(like_count\), 0\) FROM "articles"`).
		WillReturnRows(rows)

	count, err := repo.GetTotalLikes()
	assert.NoError(t, err)
	assert.Equal(t, int64(500), count)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestStatsRepository_GetPopularArticles(t *testing.T) {
	db, mock := setupMockDB(t)
	repo := NewStatsRepository(db)

	rows := sqlmock.NewRows([]string{
		"id", "title", "slug", "view_count",
	}).
		AddRow(1, "Popular 1", "popular-1", 1000).
		AddRow(2, "Popular 2", "popular-2", 800)

	mock.ExpectQuery(`SELECT .* FROM "articles"`).
		WithArgs(10).
		WillReturnRows(rows)

	// Mock author preload
	mock.ExpectQuery(`SELECT .* FROM "users"`).
		WillReturnRows(sqlmock.NewRows([]string{}))

	// Mock tags preload
	mock.ExpectQuery(`SELECT .* FROM "tags"`).
		WillReturnRows(sqlmock.NewRows([]string{}))

	articles, err := repo.GetPopularArticles(10)
	assert.NoError(t, err)
	assert.Len(t, articles, 2)
	assert.NoError(t, mock.ExpectationsWereMet())
}
