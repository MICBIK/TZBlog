package response

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func TestSuccess(t *testing.T) {
	gin.SetMode(gin.TestMode)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)

	data := map[string]string{"message": "test"}
	Success(c, data)

	assert.Equal(t, http.StatusOK, w.Code)

	var resp Response
	err := json.Unmarshal(w.Body.Bytes(), &resp)
	assert.NoError(t, err)
	assert.True(t, resp.Success)
	assert.NotNil(t, resp.Data)
}

func TestBadRequest(t *testing.T) {
	gin.SetMode(gin.TestMode)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)

	BadRequest(c, "Invalid input")

	assert.Equal(t, http.StatusBadRequest, w.Code)

	var resp Response
	err := json.Unmarshal(w.Body.Bytes(), &resp)
	assert.NoError(t, err)
	assert.False(t, resp.Success)
	assert.Equal(t, "Invalid input", resp.Error)
}

func TestUnauthorized(t *testing.T) {
	gin.SetMode(gin.TestMode)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)

	Unauthorized(c, "Not authorized")

	assert.Equal(t, http.StatusUnauthorized, w.Code)

	var resp Response
	err := json.Unmarshal(w.Body.Bytes(), &resp)
	assert.NoError(t, err)
	assert.False(t, resp.Success)
	assert.Equal(t, "Not authorized", resp.Error)
}

func TestNotFound(t *testing.T) {
	gin.SetMode(gin.TestMode)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)

	NotFound(c, "Resource not found")

	assert.Equal(t, http.StatusNotFound, w.Code)

	var resp Response
	err := json.Unmarshal(w.Body.Bytes(), &resp)
	assert.NoError(t, err)
	assert.False(t, resp.Success)
	assert.Equal(t, "Resource not found", resp.Error)
}

func TestInternalError(t *testing.T) {
	gin.SetMode(gin.TestMode)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)

	InternalServerError(c, "Server error")

	assert.Equal(t, http.StatusInternalServerError, w.Code)

	var resp Response
	err := json.Unmarshal(w.Body.Bytes(), &resp)
	assert.NoError(t, err)
	assert.False(t, resp.Success)
	assert.Equal(t, "Server error", resp.Error)
}

func TestCreated(t *testing.T) {
	gin.SetMode(gin.TestMode)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)

	data := map[string]string{"id": "123"}
	Created(c, data)

	assert.Equal(t, http.StatusCreated, w.Code)

	var resp Response
	err := json.Unmarshal(w.Body.Bytes(), &resp)
	assert.NoError(t, err)
	assert.True(t, resp.Success)
	assert.NotNil(t, resp.Data)
}

func TestForbidden(t *testing.T) {
	gin.SetMode(gin.TestMode)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)

	Forbidden(c, "Access forbidden")

	assert.Equal(t, http.StatusForbidden, w.Code)

	var resp Response
	err := json.Unmarshal(w.Body.Bytes(), &resp)
	assert.NoError(t, err)
	assert.False(t, resp.Success)
	assert.Equal(t, "Access forbidden", resp.Error)
}

func TestInternalErrorAlias(t *testing.T) {
	gin.SetMode(gin.TestMode)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)

	InternalError(c, "Internal error")

	assert.Equal(t, http.StatusInternalServerError, w.Code)

	var resp Response
	err := json.Unmarshal(w.Body.Bytes(), &resp)
	assert.NoError(t, err)
	assert.False(t, resp.Success)
	assert.Equal(t, "Internal error", resp.Error)
}

func TestPaginated(t *testing.T) {
	gin.SetMode(gin.TestMode)

	tests := []struct {
		name           string
		total          int64
		page           int
		limit          int
		expectedPages  int
	}{
		{
			name:          "exact pages",
			total:         100,
			page:          1,
			limit:         10,
			expectedPages: 10,
		},
		{
			name:          "with remainder",
			total:         105,
			page:          2,
			limit:         10,
			expectedPages: 11,
		},
		{
			name:          "single page",
			total:         5,
			page:          1,
			limit:         10,
			expectedPages: 1,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)

			data := []string{"item1", "item2"}
			Paginated(c, data, tt.total, tt.page, tt.limit)

			assert.Equal(t, http.StatusOK, w.Code)

			var resp PaginatedResponse
			err := json.Unmarshal(w.Body.Bytes(), &resp)
			assert.NoError(t, err)
			assert.True(t, resp.Success)
			assert.NotNil(t, resp.Data)
			assert.Equal(t, tt.total, resp.Meta.Total)
			assert.Equal(t, tt.page, resp.Meta.Page)
			assert.Equal(t, tt.limit, resp.Meta.Limit)
			assert.Equal(t, tt.expectedPages, resp.Meta.TotalPages)
		})
	}
}

func TestHandleError(t *testing.T) {
	gin.SetMode(gin.TestMode)

	tests := []struct {
		name           string
		err            error
		expectedStatus int
		expectedError  string
	}{
		{
			name:           "nil error",
			err:            nil,
			expectedStatus: 0, // no response
		},
		{
			name:           "article not found",
			err:            &testError{msg: "article not found"},
			expectedStatus: http.StatusNotFound,
			expectedError:  "article not found",
		},
		{
			name:           "user not found",
			err:            &testError{msg: "user not found"},
			expectedStatus: http.StatusNotFound,
			expectedError:  "user not found",
		},
		{
			name:           "unauthorized",
			err:            &testError{msg: "unauthorized to perform this action"},
			expectedStatus: http.StatusUnauthorized,
			expectedError:  "unauthorized to perform this action",
		},
		{
			name:           "username already exists",
			err:            &testError{msg: "username already exists"},
			expectedStatus: http.StatusConflict,
			expectedError:  "username already exists",
		},
		{
			name:           "email already exists",
			err:            &testError{msg: "email already exists"},
			expectedStatus: http.StatusConflict,
			expectedError:  "email already exists",
		},
		{
			name:           "invalid username or password",
			err:            &testError{msg: "invalid username or password"},
			expectedStatus: http.StatusUnauthorized,
			expectedError:  "invalid username or password",
		},
		{
			name:           "validation error",
			err:            &testError{msg: "article title is required"},
			expectedStatus: http.StatusBadRequest,
			expectedError:  "article title is required",
		},
		{
			name:           "password validation",
			err:            &testError{msg: "password must be at least 8 characters"},
			expectedStatus: http.StatusBadRequest,
			expectedError:  "password must be at least 8 characters",
		},
		{
			name:           "unknown error",
			err:            &testError{msg: "some random error"},
			expectedStatus: http.StatusInternalServerError,
			expectedError:  "An error occurred",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)

			HandleError(c, tt.err)

			if tt.expectedStatus == 0 {
				// nil error case - no response written, body is empty
				assert.Equal(t, "", w.Body.String())
				return
			}

			assert.Equal(t, tt.expectedStatus, w.Code)

			var resp Response
			err := json.Unmarshal(w.Body.Bytes(), &resp)
			assert.NoError(t, err)
			assert.False(t, resp.Success)
			assert.Equal(t, tt.expectedError, resp.Error)
		})
	}
}

// testError is a helper type for testing
type testError struct {
	msg string
}

func (e *testError) Error() string {
	return e.msg
}

