package progress

import "github.com/MICBIK/TZBlog/backend/pkg/errors"

// Progress domain errors
var (
	ErrProgressNotFound = &errors.AppError{
		Code:    "PROGRESS_NOT_FOUND",
		Message: "Progress record not found",
	}

	ErrInvalidProgress = &errors.AppError{
		Code:    "INVALID_PROGRESS",
		Message: "Invalid progress value",
	}
)
