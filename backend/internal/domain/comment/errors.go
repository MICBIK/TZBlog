package comment

import "github.com/MICBIK/TZBlog/backend/pkg/errors"

// Comment domain errors
var (
	ErrCommentNotFound = &errors.AppError{
		Code:    "COMMENT_NOT_FOUND",
		Message: "Comment not found",
	}

	ErrCommentDeleted = &errors.AppError{
		Code:    "COMMENT_DELETED",
		Message: "Comment has been deleted",
	}

	ErrInvalidCommentContent = &errors.AppError{
		Code:    "INVALID_COMMENT_CONTENT",
		Message: "Comment content is invalid",
	}

	ErrCommentTooLong = &errors.AppError{
		Code:    "COMMENT_TOO_LONG",
		Message: "Comment content exceeds maximum length",
	}

	ErrInvalidParent = &errors.AppError{
		Code:    "INVALID_PARENT_COMMENT",
		Message: "Invalid parent comment",
	}

	ErrUnauthorized = &errors.AppError{
		Code:    "UNAUTHORIZED",
		Message: "Unauthorized to perform this action",
	}

	ErrInvalidContent = &errors.AppError{
		Code:    "INVALID_CONTENT",
		Message: "Comment content is required",
	}

	ErrContentTooLong = &errors.AppError{
		Code:    "CONTENT_TOO_LONG",
		Message: "Comment content is too long (max 1000 characters)",
	}

	ErrInvalidArticleID = &errors.AppError{
		Code:    "INVALID_ARTICLE_ID",
		Message: "Article ID is required",
	}

	ErrInvalidUserID = &errors.AppError{
		Code:    "INVALID_USER_ID",
		Message: "User ID is required",
	}
)
