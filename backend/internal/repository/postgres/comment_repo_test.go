package postgres

import (
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/MICBIK/TZBlog/backend/internal/domain/comment"
	"github.com/stretchr/testify/assert"
)

func TestCommentRepository_Create(t *testing.T) {
	db, mock := setupMockDB(t)
	repo := NewCommentRepository(db)

	newComment := &comment.Comment{
		ArticleID: 1,
		UserID:    1,
		Content:   "Test comment",
	}

	mock.ExpectBegin()
	mock.ExpectQuery(`INSERT INTO "comments"`).
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(1))
	mock.ExpectCommit()

	err := repo.Create(newComment)
	assert.NoError(t, err)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestCommentRepository_FindByArticleID(t *testing.T) {
	db, mock := setupMockDB(t)
	repo := NewCommentRepository(db)

	countRows := sqlmock.NewRows([]string{"count"}).AddRow(2)
	mock.ExpectQuery(`SELECT count\(\*\) FROM "comments" WHERE article_id`).
		WithArgs(int64(1)).
		WillReturnRows(countRows)

	rows := sqlmock.NewRows([]string{
		"id", "article_id", "user_id", "content",
	}).
		AddRow(1, 1, 1, "Comment 1").
		AddRow(2, 1, 2, "Comment 2")

	mock.ExpectQuery(`SELECT .* FROM "comments" WHERE article_id`).
		WithArgs(int64(1)).
		WillReturnRows(rows)

	comments, total, err := repo.FindByArticleID(1, 10, 0)
	assert.NoError(t, err)
	assert.Len(t, comments, 2)
	assert.Equal(t, int64(2), total)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestCommentRepository_Delete(t *testing.T) {
	db, mock := setupMockDB(t)
	repo := NewCommentRepository(db)

	mock.ExpectBegin()
	mock.ExpectExec(`UPDATE "comments" SET "deleted_at"`).
		WithArgs(sqlmock.AnyArg(), int64(1)).
		WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectCommit()

	err := repo.Delete(1)
	assert.NoError(t, err)
	assert.NoError(t, mock.ExpectationsWereMet())
}
