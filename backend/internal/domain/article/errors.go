package article

import "github.com/MICBIK/TZBlog/backend/pkg/errors"

// Article domain errors
var (
	ErrArticleNotFound = &errors.AppError{
		Code:    "ARTICLE_NOT_FOUND",
		Message: "Article not found",
	}

	ErrArticleSlugExists = &errors.AppError{
		Code:    "ARTICLE_SLUG_EXISTS",
		Message: "Article slug already exists",
	}

	ErrInvalidArticleStatus = &errors.AppError{
		Code:    "INVALID_ARTICLE_STATUS",
		Message: "Invalid article status",
	}

	ErrInvalidTitle = &errors.AppError{
		Code:    "INVALID_TITLE",
		Message: "Article title is required",
	}

	ErrTitleTooLong = &errors.AppError{
		Code:    "TITLE_TOO_LONG",
		Message: "Article title is too long (max 200 characters)",
	}

	ErrInvalidContent = &errors.AppError{
		Code:    "INVALID_CONTENT",
		Message: "Article content is required",
	}

	ErrContentTooLong = &errors.AppError{
		Code:    "CONTENT_TOO_LONG",
		Message: "Article content is too long (max 100,000 characters)",
	}

	ErrInvalidSummary = &errors.AppError{
		Code:    "INVALID_SUMMARY",
		Message: "Article summary is too long (max 500 characters)",
	}

	ErrInvalidSlug = &errors.AppError{
		Code:    "INVALID_SLUG",
		Message: "Invalid article slug",
	}

	ErrInvalidAuthorID = &errors.AppError{
		Code:    "INVALID_AUTHOR_ID",
		Message: "Article author ID is required",
	}

	ErrUnauthorized = &errors.AppError{
		Code:    "UNAUTHORIZED",
		Message: "Unauthorized to perform this action",
	}

	ErrInvalidInput = &errors.AppError{
		Code:    "INVALID_INPUT",
		Message: "Invalid input parameters",
	}

	// Alias for backward compatibility
	ErrInvalidStatus = ErrInvalidArticleStatus
)
