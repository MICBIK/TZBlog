package payment

import "github.com/MICBIK/TZBlog/backend/pkg/errors"

// Payment domain errors
var (
	ErrPaymentFailed = &errors.AppError{
		Code:    "PAYMENT_FAILED",
		Message: "Payment processing failed",
	}

	ErrInvalidAmount = &errors.AppError{
		Code:    "INVALID_AMOUNT",
		Message: "Invalid payment amount",
	}

	ErrOrderNotFound = &errors.AppError{
		Code:    "ORDER_NOT_FOUND",
		Message: "Order not found",
	}

	ErrPaymentExpired = &errors.AppError{
		Code:    "PAYMENT_EXPIRED",
		Message: "Payment session has expired",
	}

	ErrInvalidPaymentMethod = &errors.AppError{
		Code:    "INVALID_PAYMENT_METHOD",
		Message: "Invalid payment method",
	}
)
