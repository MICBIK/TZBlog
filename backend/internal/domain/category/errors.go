package category

import "github.com/MICBIK/TZBlog/backend/pkg/errors"

// Category domain errors
var (
	ErrCategoryNotFound = &errors.AppError{
		Code:    "CATEGORY_NOT_FOUND",
		Message: "Category not found",
	}

	ErrCategoryExists = &errors.AppError{
		Code:    "CATEGORY_EXISTS",
		Message: "Category already exists",
	}

	ErrInvalidCategoryName = &errors.AppError{
		Code:    "INVALID_CATEGORY_NAME",
		Message: "Category name is invalid",
	}
)
