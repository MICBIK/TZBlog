package like

import "github.com/MICBIK/TZBlog/backend/pkg/errors"

// Like domain errors
var (
	ErrLikeNotFound = &errors.AppError{
		Code:    "LIKE_NOT_FOUND",
		Message: "Like not found",
	}

	ErrAlreadyLiked = &errors.AppError{
		Code:    "ALREADY_LIKED",
		Message: "Already liked this resource",
	}

	ErrInvalidLikeType = &errors.AppError{
		Code:    "INVALID_LIKE_TYPE",
		Message: "Invalid like type",
	}
)
