package response

import (
	"net/http"
	"strings"

	"github.com/MICBIK/TZBlog/backend/pkg/errors"
	"github.com/gin-gonic/gin"
)

// Response represents the standard API response format
type Response struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
	Code    string      `json:"code,omitempty"`
	Details interface{} `json:"details,omitempty"`
}

// ErrorResponse represents a detailed error response with i18n support
type ErrorResponse struct {
	Success     bool              `json:"success"`
	Error       string            `json:"error"`
	Code        string            `json:"code"`
	Details     interface{}       `json:"details,omitempty"`
	MessageI18n map[string]string `json:"message_i18n,omitempty"`
}

// Success sends a successful response
func Success(c *gin.Context, data interface{}) {
	c.JSON(http.StatusOK, Response{
		Success: true,
		Data:    data,
	})
}

// Created sends a 201 Created response
func Created(c *gin.Context, data interface{}) {
	c.JSON(http.StatusCreated, Response{
		Success: true,
		Data:    data,
	})
}

// BadRequest sends a 400 Bad Request response
func BadRequest(c *gin.Context, message string) {
	c.JSON(http.StatusBadRequest, Response{
		Success: false,
		Error:   message,
	})
}

// Unauthorized sends a 401 Unauthorized response
func Unauthorized(c *gin.Context, message string) {
	c.JSON(http.StatusUnauthorized, Response{
		Success: false,
		Error:   message,
	})
}

// Forbidden sends a 403 Forbidden response
func Forbidden(c *gin.Context, message string) {
	c.JSON(http.StatusForbidden, Response{
		Success: false,
		Error:   message,
	})
}

// NotFound sends a 404 Not Found response
func NotFound(c *gin.Context, message string) {
	c.JSON(http.StatusNotFound, Response{
		Success: false,
		Error:   message,
	})
}

// InternalServerError sends a 500 Internal Server Error response
func InternalServerError(c *gin.Context, message string) {
	c.JSON(http.StatusInternalServerError, Response{
		Success: false,
		Error:   message,
	})
}

// InternalError is an alias for InternalServerError
func InternalError(c *gin.Context, message string) {
	InternalServerError(c, message)
}

// PaginatedResponse represents a paginated API response
type PaginatedResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data"`
	Meta    Pagination  `json:"meta"`
}

// Pagination contains pagination metadata
type Pagination struct {
	Total      int64 `json:"total"`
	Page       int   `json:"page"`
	Limit      int   `json:"limit"`
	TotalPages int   `json:"total_pages"`
}

// Paginated sends a paginated response
func Paginated(c *gin.Context, data interface{}, total int64, page, limit int) {
	totalPages := int(total) / limit
	if int(total)%limit > 0 {
		totalPages++
	}

	c.JSON(http.StatusOK, PaginatedResponse{
		Success: true,
		Data:    data,
		Meta: Pagination{
			Total:      total,
			Page:       page,
			Limit:      limit,
			TotalPages: totalPages,
		},
	})
}

// SuccessResponse represents a simple success message response
type SuccessResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
}

// getLanguage extracts the preferred language from Accept-Language header
func getLanguage(c *gin.Context) string {
	acceptLang := c.GetHeader("Accept-Language")
	if acceptLang == "" {
		return "en"
	}

	// Parse Accept-Language header (e.g., "zh-CN,zh;q=0.9,en;q=0.8")
	langs := strings.Split(acceptLang, ",")
	if len(langs) > 0 {
		// Get the first language
		lang := strings.TrimSpace(strings.Split(langs[0], ";")[0])
		// Normalize language code
		if strings.HasPrefix(lang, "zh") {
			if strings.Contains(lang, "TW") || strings.Contains(lang, "HK") {
				return "zh-TW"
			}
			return "zh"
		}
		// Return first two characters for other languages
		if len(lang) >= 2 {
			return lang[:2]
		}
	}
	return "en"
}

// ErrorWithCode sends an error response with error code and i18n support
func ErrorWithCode(c *gin.Context, statusCode int, code string, details interface{}) {
	lang := getLanguage(c)
	message := errors.GetLocalizedMessage(code, lang)

	// Include all translations in development mode
	var messageI18n map[string]string
	if gin.Mode() == gin.DebugMode {
		messageI18n = errors.GetAllLocalizedMessages(code)
	}

	c.JSON(statusCode, ErrorResponse{
		Success:     false,
		Error:       message,
		Code:        code,
		Details:     details,
		MessageI18n: messageI18n,
	})
}

// HandleError handles domain errors and maps them to appropriate HTTP responses
func HandleError(c *gin.Context, err error) {
	if err == nil {
		return
	}

	// Handle AppError with code
	if appErr, ok := err.(*errors.AppError); ok {
		statusCode := getHTTPStatusFromCode(appErr.Code)
		ErrorWithCode(c, statusCode, appErr.Code, appErr.Details)
		return
	}

	// Fallback to generic error
	ErrorWithCode(c, http.StatusInternalServerError, "INTERNAL_SERVER_ERROR", nil)
}

// getHTTPStatusFromCode maps error codes to HTTP status codes
func getHTTPStatusFromCode(code string) int {
	switch code {
	// 401 Unauthorized
	case "UNAUTHORIZED", "INVALID_TOKEN", "TOKEN_REVOKED", "INVALID_CREDENTIALS":
		return http.StatusUnauthorized

	// 403 Forbidden
	case "FORBIDDEN":
		return http.StatusForbidden

	// 404 Not Found
	case "ARTICLE_NOT_FOUND", "USER_NOT_FOUND", "COMMENT_NOT_FOUND",
		"CATEGORY_NOT_FOUND", "TAG_NOT_FOUND", "SUBSCRIPTION_NOT_FOUND",
		"ORDER_NOT_FOUND", "NOT_FOUND":
		return http.StatusNotFound

	// 409 Conflict
	case "USER_EXISTS", "ARTICLE_SLUG_EXISTS", "ALREADY_SUBSCRIBED", "CONFLICT":
		return http.StatusConflict

	// 410 Gone
	case "COMMENT_DELETED":
		return http.StatusGone

	// 429 Too Many Requests
	case "TOO_MANY_REQUESTS", "RATE_LIMIT_EXCEEDED":
		return http.StatusTooManyRequests

	// 400 Bad Request (default for validation errors)
	case "INVALID_EMAIL", "WEAK_PASSWORD", "INVALID_ARTICLE_STATUS",
		"INVALID_VERIFICATION_TOKEN", "INVALID_AMOUNT", "INVALID_FILE_TYPE",
		"FILE_TOO_LARGE", "INVALID_INPUT", "MISSING_FIELD", "INVALID_FORMAT",
		"BAD_REQUEST":
		return http.StatusBadRequest

	// 500 Internal Server Error
	case "PAYMENT_FAILED", "UPLOAD_FAILED", "INTERNAL_SERVER_ERROR":
		return http.StatusInternalServerError

	default:
		return http.StatusInternalServerError
	}
}
