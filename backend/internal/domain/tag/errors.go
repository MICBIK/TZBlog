package tag

import "github.com/MICBIK/TZBlog/backend/pkg/errors"

// Tag domain errors
var (
	ErrTagNotFound = &errors.AppError{
		Code:    "TAG_NOT_FOUND",
		Message: "Tag not found",
	}

	ErrTagExists = &errors.AppError{
		Code:    "TAG_EXISTS",
		Message: "Tag already exists",
	}

	ErrInvalidTagName = &errors.AppError{
		Code:    "INVALID_TAG_NAME",
		Message: "Tag name is invalid",
	}
)
