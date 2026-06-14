package apikey

import "github.com/MICBIK/TZBlog/backend/pkg/errors"

// API Key domain errors
var (
	ErrAPIKeyNotFound = &errors.AppError{
		Code:    "APIKEY_NOT_FOUND",
		Message: "API key not found",
	}

	ErrAPIKeyExpired = &errors.AppError{
		Code:    "APIKEY_EXPIRED",
		Message: "API key has expired",
	}

	ErrAPIKeyRevoked = &errors.AppError{
		Code:    "APIKEY_REVOKED",
		Message: "API key has been revoked",
	}

	ErrInvalidAPIKey = &errors.AppError{
		Code:    "INVALID_APIKEY",
		Message: "Invalid API key",
	}
)
