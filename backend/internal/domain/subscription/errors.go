package subscription

import "github.com/MICBIK/TZBlog/backend/pkg/errors"

// Subscription domain errors
var (
	ErrSubscriptionNotFound = &errors.AppError{
		Code:    "SUBSCRIPTION_NOT_FOUND",
		Message: "Subscription not found",
	}

	ErrAlreadySubscribed = &errors.AppError{
		Code:    "ALREADY_SUBSCRIBED",
		Message: "Email already subscribed",
	}

	ErrInvalidVerificationToken = &errors.AppError{
		Code:    "INVALID_VERIFICATION_TOKEN",
		Message: "Invalid verification token",
	}

	ErrSubscriptionExpired = &errors.AppError{
		Code:    "SUBSCRIPTION_EXPIRED",
		Message: "Subscription has expired",
	}
)
