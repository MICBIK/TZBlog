package errors

import "fmt"

// AppError represents application-level error with structured information
type AppError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
	Details any    `json:"details,omitempty"`
	Cause   error  `json:"-"`
}

func (e *AppError) Error() string {
	if e.Cause != nil {
		return fmt.Sprintf("%s: %v", e.Message, e.Cause)
	}
	return e.Message
}

func (e *AppError) Unwrap() error {
	return e.Cause
}

// WithDetails adds details to the error
func (e *AppError) WithDetails(details any) *AppError {
	return &AppError{
		Code:    e.Code,
		Message: e.Message,
		Details: details,
		Cause:   e.Cause,
	}
}

// WithCause adds a cause to the error
func (e *AppError) WithCause(cause error) *AppError {
	return &AppError{
		Code:    e.Code,
		Message: e.Message,
		Details: e.Details,
		Cause:   cause,
	}
}

// Common error definitions
var (
	// Authentication & Authorization
	ErrUnauthorized       = &AppError{Code: "UNAUTHORIZED", Message: "Authentication required"}
	ErrForbidden          = &AppError{Code: "FORBIDDEN", Message: "Permission denied"}
	ErrInvalidToken       = &AppError{Code: "INVALID_TOKEN", Message: "Invalid or expired token"}
	ErrTokenRevoked       = &AppError{Code: "TOKEN_REVOKED", Message: "Token has been revoked"}
	ErrInvalidCredentials = &AppError{Code: "INVALID_CREDENTIALS", Message: "Invalid email or password"}

	// Article errors
	ErrArticleNotFound      = &AppError{Code: "ARTICLE_NOT_FOUND", Message: "Article not found"}
	ErrArticleSlugExists    = &AppError{Code: "ARTICLE_SLUG_EXISTS", Message: "Article slug already exists"}
	ErrInvalidArticleStatus = &AppError{Code: "INVALID_ARTICLE_STATUS", Message: "Invalid article status"}

	// User errors
	ErrUserNotFound = &AppError{Code: "USER_NOT_FOUND", Message: "User not found"}
	ErrUserExists   = &AppError{Code: "USER_EXISTS", Message: "User already exists"}
	ErrInvalidEmail = &AppError{Code: "INVALID_EMAIL", Message: "Invalid email address"}
	ErrWeakPassword = &AppError{Code: "WEAK_PASSWORD", Message: "Password is too weak"}

	// Comment errors
	ErrCommentNotFound = &AppError{Code: "COMMENT_NOT_FOUND", Message: "Comment not found"}
	ErrCommentDeleted  = &AppError{Code: "COMMENT_DELETED", Message: "Comment has been deleted"}

	// Category & Tag errors
	ErrCategoryNotFound = &AppError{Code: "CATEGORY_NOT_FOUND", Message: "Category not found"}
	ErrTagNotFound      = &AppError{Code: "TAG_NOT_FOUND", Message: "Tag not found"}

	// Subscription errors
	ErrSubscriptionNotFound     = &AppError{Code: "SUBSCRIPTION_NOT_FOUND", Message: "Subscription not found"}
	ErrAlreadySubscribed        = &AppError{Code: "ALREADY_SUBSCRIBED", Message: "Email already subscribed"}
	ErrInvalidVerificationToken = &AppError{Code: "INVALID_VERIFICATION_TOKEN", Message: "Invalid verification token"}

	// Payment errors
	ErrPaymentFailed = &AppError{Code: "PAYMENT_FAILED", Message: "Payment processing failed"}
	ErrInvalidAmount = &AppError{Code: "INVALID_AMOUNT", Message: "Invalid payment amount"}
	ErrOrderNotFound = &AppError{Code: "ORDER_NOT_FOUND", Message: "Order not found"}

	// File upload errors
	ErrInvalidFileType = &AppError{Code: "INVALID_FILE_TYPE", Message: "Invalid file type"}
	ErrFileTooLarge    = &AppError{Code: "FILE_TOO_LARGE", Message: "File size exceeds limit"}
	ErrUploadFailed    = &AppError{Code: "UPLOAD_FAILED", Message: "File upload failed"}

	// Validation errors
	ErrInvalidInput  = &AppError{Code: "INVALID_INPUT", Message: "Invalid input data"}
	ErrMissingField  = &AppError{Code: "MISSING_FIELD", Message: "Required field is missing"}
	ErrInvalidFormat = &AppError{Code: "INVALID_FORMAT", Message: "Invalid data format"}

	// Rate limiting
	ErrTooManyRequests   = &AppError{Code: "TOO_MANY_REQUESTS", Message: "Too many requests, please try again later"}
	ErrRateLimitExceeded = &AppError{Code: "RATE_LIMIT_EXCEEDED", Message: "Rate limit exceeded"}

	// General errors
	ErrInternalServer = &AppError{Code: "INTERNAL_SERVER_ERROR", Message: "Internal server error"}
	ErrNotFound       = &AppError{Code: "NOT_FOUND", Message: "Resource not found"}
	ErrBadRequest     = &AppError{Code: "BAD_REQUEST", Message: "Bad request"}
	ErrConflict       = &AppError{Code: "CONFLICT", Message: "Resource conflict"}
)

// New creates a new AppError
func New(code, message string) *AppError {
	return &AppError{
		Code:    code,
		Message: message,
	}
}

// Wrap wraps an error with additional context
func Wrap(err error, code, message string) *AppError {
	return &AppError{
		Code:    code,
		Message: message,
		Cause:   err,
	}
}
