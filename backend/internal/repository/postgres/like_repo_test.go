package postgres

import (
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/MICBIK/TZBlog/backend/internal/domain/like"
	"github.com/stretchr/testify/assert"
)

func TestLikeRepository_Create(t *testing.T) {
	db, mock := setupMockDB(t)
	repo := NewLikeRepository(db)

	newLike := &like.Like{
		UserID:    1,
		ArticleID: 1,
	}

	mock.ExpectBegin()
	mock.ExpectQuery(`INSERT INTO "likes"`).
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(1))
	mock.ExpectCommit()

	err := repo.Create(newLike)
	assert.NoError(t, err)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestLikeRepository_Delete(t *testing.T) {
	db, mock := setupMockDB(t)
	repo := NewLikeRepository(db)

	mock.ExpectBegin()
	mock.ExpectExec(`DELETE FROM "likes"`).
		WithArgs(int64(1), int64(1)).
		WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectCommit()

	err := repo.Delete(1, 1)
	assert.NoError(t, err)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestLikeRepository_HasLiked(t *testing.T) {
	db, mock := setupMockDB(t)
	repo := NewLikeRepository(db)

	rows := sqlmock.NewRows([]string{"count"}).AddRow(1)

	mock.ExpectQuery(`SELECT count\(\*\) FROM "likes"`).
		WithArgs(int64(1), int64(1)).
		WillReturnRows(rows)

	hasLiked, err := repo.HasLiked(1, 1)
	assert.NoError(t, err)
	assert.True(t, hasLiked)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestLikeRepository_HasLiked_False(t *testing.T) {
	db, mock := setupMockDB(t)
	repo := NewLikeRepository(db)

	rows := sqlmock.NewRows([]string{"count"}).AddRow(0)

	mock.ExpectQuery(`SELECT count\(\*\) FROM "likes"`).
		WithArgs(int64(1), int64(1)).
		WillReturnRows(rows)

	hasLiked, err := repo.HasLiked(1, 1)
	assert.NoError(t, err)
	assert.False(t, hasLiked)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestLikeRepository_CountByArticle(t *testing.T) {
	db, mock := setupMockDB(t)
	repo := NewLikeRepository(db)

	rows := sqlmock.NewRows([]string{"count"}).AddRow(42)

	mock.ExpectQuery(`SELECT count\(\*\) FROM "likes"`).
		WithArgs(int64(1)).
		WillReturnRows(rows)

	count, err := repo.CountByArticle(1)
	assert.NoError(t, err)
	assert.Equal(t, int64(42), count)
	assert.NoError(t, mock.ExpectationsWereMet())
}
