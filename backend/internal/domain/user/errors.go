package user

import "github.com/MICBIK/TZBlog/backend/pkg/errors"

// User domain errors
var (
	ErrUserNotFound = &errors.AppError{
		Code:    "USER_NOT_FOUND",
		Message: "User not found",
	}

	ErrUserExists = &errors.AppError{
		Code:    "USER_EXISTS",
		Message: "User already exists",
	}

	ErrInvalidEmail = &errors.AppError{
		Code:    "INVALID_EMAIL",
		Message: "Invalid email address",
	}

	ErrWeakPassword = &errors.AppError{
		Code:    "WEAK_PASSWORD",
		Message: "Password is too weak",
	}

	ErrInvalidCredentials = &errors.AppError{
		Code:    "INVALID_CREDENTIALS",
		Message: "Invalid email or password",
	}

	ErrInvalidUsername = &errors.AppError{
		Code:    "INVALID_USERNAME",
		Message: "Invalid username",
	}

	ErrInvalidUsernameLength = &errors.AppError{
		Code:    "INVALID_USERNAME_LENGTH",
		Message: "Username must be between 3 and 50 characters",
	}

	ErrInvalidUsernameFormat = &errors.AppError{
		Code:    "INVALID_USERNAME_FORMAT",
		Message: "Username can only contain letters, numbers, underscores, and hyphens",
	}

	ErrInvalidEmailFormat = &errors.AppError{
		Code:    "INVALID_EMAIL_FORMAT",
		Message: "Invalid email format",
	}

	ErrPasswordTooShort = &errors.AppError{
		Code:    "PASSWORD_TOO_SHORT",
		Message: "Password must be at least 8 characters",
	}

	ErrPasswordTooLong = &errors.AppError{
		Code:    "PASSWORD_TOO_LONG",
		Message: "Password must be at most 72 characters",
	}

	ErrDisplayNameTooLong = &errors.AppError{
		Code:    "DISPLAY_NAME_TOO_LONG",
		Message: "Display name must be at most 100 characters",
	}

	ErrBioTooLong = &errors.AppError{
		Code:    "BIO_TOO_LONG",
		Message: "Bio must be at most 500 characters",
	}

	ErrUsernameExists = &errors.AppError{
		Code:    "USERNAME_EXISTS",
		Message: "Username already exists",
	}

	ErrEmailExists = &errors.AppError{
		Code:    "EMAIL_EXISTS",
		Message: "Email already exists",
	}

	ErrAccountInactive = &errors.AppError{
		Code:    "ACCOUNT_INACTIVE",
		Message: "Account is inactive",
	}

	ErrAccountBanned = &errors.AppError{
		Code:    "ACCOUNT_BANNED",
		Message: "Account has been banned",
	}

	ErrPasswordReused = &errors.AppError{
		Code:    "PASSWORD_REUSED",
		Message: "Password was recently used, please choose a different password",
	}
)
