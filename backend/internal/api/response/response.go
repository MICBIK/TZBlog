package response

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	apperrors "github.com/MICBIK/TZBlog/backend/pkg/errors"
)

// Response 统一响应结构
type Response struct {
	Success  bool      `json:"success"`
	Data     any       `json:"data,omitempty"`
	Error    *Error    `json:"error,omitempty"`
	Metadata *Metadata `json:"metadata,omitempty"`
}

// Metadata 分页元数据
type Metadata struct {
	Total      int `json:"total"`
	Page       int `json:"page"`
	Limit      int `json:"limit"`
	TotalPages int `json:"totalPages"`
}

// Error 错误响应结构
type Error struct {
	Code    string `json:"code"`
	Message string `json:"message"`
	Details any    `json:"details,omitempty"`
}

// HandleError 统一错误处理
func HandleError(c *gin.Context, err error) {
	var appErr *apperrors.AppError
	if errors.As(err, &appErr) {
		c.JSON(getStatusCode(appErr.Code), Response{
			Success: false,
			Error: &Error{
				Code:    appErr.Code,
				Message: appErr.Message,
				Details: appErr.Details,
			},
		})
		return
	}

	// 未知错误，返回 500
	c.JSON(http.StatusInternalServerError, Response{
		Success: false,
		Error: &Error{
			Code:    "INTERNAL_SERVER_ERROR",
			Message: "Internal server error",
		},
	})
}

// getStatusCode 根据错误代码返回 HTTP 状态码
func getStatusCode(code string) int {
	switch code {
	// 400 Bad Request
	case "BAD_REQUEST", "INVALID_INPUT", "MISSING_FIELD", "INVALID_FORMAT",
		"INVALID_ARTICLE_STATUS", "INVALID_EMAIL", "WEAK_PASSWORD",
		"INVALID_AMOUNT", "INVALID_FILE_TYPE", "FILE_TOO_LARGE":
		return http.StatusBadRequest

	// 401 Unauthorized
	case "UNAUTHORIZED", "INVALID_TOKEN", "TOKEN_REVOKED", "INVALID_CREDENTIALS":
		return http.StatusUnauthorized

	// 403 Forbidden
	case "FORBIDDEN":
		return http.StatusForbidden

	// 404 Not Found
	case "NOT_FOUND", "ARTICLE_NOT_FOUND", "USER_NOT_FOUND", "COMMENT_NOT_FOUND",
		"CATEGORY_NOT_FOUND", "TAG_NOT_FOUND", "SUBSCRIPTION_NOT_FOUND", "ORDER_NOT_FOUND":
		return http.StatusNotFound

	// 409 Conflict
	case "CONFLICT", "ARTICLE_SLUG_EXISTS", "USER_EXISTS", "ALREADY_SUBSCRIBED":
		return http.StatusConflict

	// 429 Too Many Requests
	case "TOO_MANY_REQUESTS", "RATE_LIMIT_EXCEEDED":
		return http.StatusTooManyRequests

	// 500 Internal Server Error
	case "INTERNAL_SERVER_ERROR", "PAYMENT_FAILED", "UPLOAD_FAILED":
		return http.StatusInternalServerError

	default:
		return http.StatusInternalServerError
	}
}

// Success 成功响应
func Success(c *gin.Context, data any) {
	c.JSON(http.StatusOK, Response{
		Success: true,
		Data:    data,
	})
}

// Created 创建成功响应
func Created(c *gin.Context, data any) {
	c.JSON(http.StatusCreated, Response{
		Success: true,
		Data:    data,
	})
}

// NoContent 无内容响应
func NoContent(c *gin.Context) {
	c.JSON(http.StatusNoContent, Response{
		Success: true,
	})
}

// BadRequest 400 错误
func BadRequest(c *gin.Context, message string) {
	c.JSON(http.StatusBadRequest, Response{
		Success: false,
		Error: &Error{
			Code:    "BAD_REQUEST",
			Message: message,
		},
	})
}

// Unauthorized 401 错误
func Unauthorized(c *gin.Context, message string) {
	c.JSON(http.StatusUnauthorized, Response{
		Success: false,
		Error: &Error{
			Code:    "UNAUTHORIZED",
			Message: message,
		},
	})
}

// Forbidden 403 错误
func Forbidden(c *gin.Context, message string) {
	c.JSON(http.StatusForbidden, Response{
		Success: false,
		Error: &Error{
			Code:    "FORBIDDEN",
			Message: message,
		},
	})
}

// NotFound 404 错误
func NotFound(c *gin.Context, message string) {
	c.JSON(http.StatusNotFound, Response{
		Success: false,
		Error: &Error{
			Code:    "NOT_FOUND",
			Message: message,
		},
	})
}

// InternalError 500 错误
func InternalError(c *gin.Context, message string) {
	c.JSON(http.StatusInternalServerError, Response{
		Success: false,
		Error: &Error{
			Code:    "INTERNAL_SERVER_ERROR",
			Message: message,
		},
	})
}

// TooManyRequests 429 错误
func TooManyRequests(c *gin.Context, message string) {
	c.JSON(http.StatusTooManyRequests, Response{
		Success: false,
		Error: &Error{
			Code:    "TOO_MANY_REQUESTS",
			Message: message,
		},
	})
}

// SuccessWithMetadata 成功响应（带分页信息）
func SuccessWithMetadata(c *gin.Context, data any, metadata *Metadata) {
	c.JSON(http.StatusOK, Response{
		Success:  true,
		Data:     data,
		Metadata: metadata,
	})
}

// Paginated 分页响应（兼容旧接口）
func Paginated(c *gin.Context, data any, total int64, page, limit int) {
	totalPages := int((total + int64(limit) - 1) / int64(limit))
	if totalPages < 1 {
		totalPages = 1
	}

	SuccessWithMetadata(c, data, &Metadata{
		Total:      int(total),
		Page:       page,
		Limit:      limit,
		TotalPages: totalPages,
	})
}
