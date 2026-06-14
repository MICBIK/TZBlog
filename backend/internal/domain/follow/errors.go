package follow

import "github.com/MICBIK/TZBlog/backend/pkg/errors"

// Follow domain errors
var (
	ErrFollowNotFound = &errors.AppError{
		Code:    "FOLLOW_NOT_FOUND",
		Message: "Follow relationship not found",
	}

	ErrAlreadyFollowing = &errors.AppError{
		Code:    "ALREADY_FOLLOWING",
		Message: "Already following this user",
	}

	ErrCannotFollowSelf = &errors.AppError{
		Code:    "CANNOT_FOLLOW_SELF",
		Message: "Cannot follow yourself",
	}
)
