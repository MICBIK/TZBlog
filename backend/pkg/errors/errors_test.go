package errors

import (
	"errors"
	"testing"

	"github.com/stretchr/testify/assert"
)

// TestAppError_Error tests the Error() method
func TestAppError_Error(t *testing.T) {
	// Test without cause
	err := &AppError{
		Code:    "TEST_ERROR",
		Message: "Test error message",
	}
	assert.Equal(t, "Test error message", err.Error())

	// Test with cause
	cause := errors.New("underlying error")
	errWithCause := &AppError{
		Code:    "TEST_ERROR",
		Message: "Test error message",
		Cause:   cause,
	}
	assert.Equal(t, "Test error message: underlying error", errWithCause.Error())
}

// TestAppError_Unwrap tests the Unwrap() method
func TestAppError_Unwrap(t *testing.T) {
	cause := errors.New("root cause")
	err := &AppError{
		Code:    "TEST_ERROR",
		Message: "Test error",
		Cause:   cause,
	}

	unwrapped := err.Unwrap()
	assert.Equal(t, cause, unwrapped)
}

// TestAppError_WithDetails tests adding details to an error
func TestAppError_WithDetails(t *testing.T) {
	originalErr := &AppError{
		Code:    "TEST_ERROR",
		Message: "Original message",
	}

	details := map[string]string{
		"field": "username",
		"value": "test",
	}

	newErr := originalErr.WithDetails(details)

	assert.Equal(t, "TEST_ERROR", newErr.Code)
	assert.Equal(t, "Original message", newErr.Message)
	assert.Equal(t, details, newErr.Details)
	assert.Nil(t, newErr.Cause)
}

// TestAppError_WithCause tests adding a cause to an error
func TestAppError_WithCause(t *testing.T) {
	originalErr := &AppError{
		Code:    "TEST_ERROR",
		Message: "Original message",
	}

	cause := errors.New("database connection failed")
	newErr := originalErr.WithCause(cause)

	assert.Equal(t, "TEST_ERROR", newErr.Code)
	assert.Equal(t, "Original message", newErr.Message)
	assert.Equal(t, cause, newErr.Cause)
	assert.Nil(t, newErr.Details)
}

// TestAppError_WithDetailsAndCause tests chaining WithDetails and WithCause
func TestAppError_WithDetailsAndCause(t *testing.T) {
	err := &AppError{
		Code:    "TEST_ERROR",
		Message: "Test message",
	}

	details := "field validation failed"
	cause := errors.New("invalid format")

	finalErr := err.WithDetails(details).WithCause(cause)

	assert.Equal(t, "TEST_ERROR", finalErr.Code)
	assert.Equal(t, "Test message", finalErr.Message)
	assert.Equal(t, details, finalErr.Details)
	assert.Equal(t, cause, finalErr.Cause)
}

// TestPredefinedErrors tests that predefined errors are properly defined
func TestPredefinedErrors(t *testing.T) {
	tests := []struct {
		name     string
		err      *AppError
		wantCode string
	}{
		{"ErrUnauthorized", ErrUnauthorized, "UNAUTHORIZED"},
		{"ErrForbidden", ErrForbidden, "FORBIDDEN"},
		{"ErrInvalidToken", ErrInvalidToken, "INVALID_TOKEN"},
		{"ErrArticleNotFound", ErrArticleNotFound, "ARTICLE_NOT_FOUND"},
		{"ErrUserNotFound", ErrUserNotFound, "USER_NOT_FOUND"},
		{"ErrInvalidInput", ErrInvalidInput, "INVALID_INPUT"},
		{"ErrInternalServer", ErrInternalServer, "INTERNAL_SERVER_ERROR"},
		{"ErrTooManyRequests", ErrTooManyRequests, "TOO_MANY_REQUESTS"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			assert.Equal(t, tt.wantCode, tt.err.Code)
			assert.NotEmpty(t, tt.err.Message)
		})
	}
}

// TestAppError_ErrorsPackageCompatibility tests compatibility with standard errors package
func TestAppError_ErrorsPackageCompatibility(t *testing.T) {
	cause := errors.New("root cause")
	appErr := ErrInternalServer.WithCause(cause)

	// Test errors.Is
	assert.True(t, errors.Is(appErr, cause))

	// Test errors.As
	var targetErr *AppError
	assert.True(t, errors.As(appErr, &targetErr))
	assert.Equal(t, "INTERNAL_SERVER_ERROR", targetErr.Code)
}
