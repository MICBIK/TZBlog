package view

import "github.com/MICBIK/TZBlog/backend/pkg/errors"

// View domain errors
var (
	ErrViewNotFound = &errors.AppError{
		Code:    "VIEW_NOT_FOUND",
		Message: "View record not found",
	}

	ErrInvalidViewType = &errors.AppError{
		Code:    "INVALID_VIEW_TYPE",
		Message: "Invalid view type",
	}
)
