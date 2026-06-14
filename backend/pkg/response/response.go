package response

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// Response represents the standard API response format
type Response struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
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

// HandleError handles domain errors and maps them to appropriate HTTP responses
func HandleError(c *gin.Context, err error) {
	if err == nil {
		return
	}

	errMsg := err.Error()

	// Map common error messages to HTTP status codes
	switch errMsg {
	case "article not found", "comment not found", "user not found":
		NotFound(c, errMsg)
	case "unauthorized to perform this action", "authentication required":
		Unauthorized(c, errMsg)
	case "username already exists", "email already exists":
		c.JSON(http.StatusConflict, Response{
			Success: false,
			Error:   errMsg,
		})
	case "invalid username or password", "account is inactive", "account has been banned":
		Unauthorized(c, errMsg)
	case "article title is required", "article content is required", "invalid article status",
		"comment content is required", "invalid article ID", "invalid user ID",
		"username is required", "email is required", "invalid email format",
		"password must be at least 8 characters":
		BadRequest(c, errMsg)
	default:
		InternalError(c, "An error occurred")
	}
}
