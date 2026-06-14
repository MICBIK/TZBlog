package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/MICBIK/TZBlog/backend/pkg/logger"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func TestSystemHandler_SetLogLevel(t *testing.T) {
	// Initialize logger
	_ = logger.Init("development")

	gin.SetMode(gin.TestMode)
	handler := NewSystemHandler()

	tests := []struct {
		name           string
		requestBody    map[string]string
		expectedStatus int
		expectedLevel  string
	}{
		{
			name:           "valid level - debug",
			requestBody:    map[string]string{"level": "debug"},
			expectedStatus: http.StatusOK,
			expectedLevel:  "debug",
		},
		{
			name:           "valid level - info",
			requestBody:    map[string]string{"level": "info"},
			expectedStatus: http.StatusOK,
			expectedLevel:  "info",
		},
		{
			name:           "valid level - warn",
			requestBody:    map[string]string{"level": "warn"},
			expectedStatus: http.StatusOK,
			expectedLevel:  "warn",
		},
		{
			name:           "valid level - error",
			requestBody:    map[string]string{"level": "error"},
			expectedStatus: http.StatusOK,
			expectedLevel:  "error",
		},
		{
			name:           "invalid level",
			requestBody:    map[string]string{"level": "invalid"},
			expectedStatus: http.StatusBadRequest,
		},
		{
			name:           "missing level",
			requestBody:    map[string]string{},
			expectedStatus: http.StatusBadRequest,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)

			// Create request body
			bodyBytes, _ := json.Marshal(tt.requestBody)
			c.Request = httptest.NewRequest("PUT", "/system/log-level", bytes.NewBuffer(bodyBytes))
			c.Request.Header.Set("Content-Type", "application/json")

			// Call handler
			handler.SetLogLevel(c)

			// Check status code
			assert.Equal(t, tt.expectedStatus, w.Code)

			// Check response
			var response map[string]interface{}
			err := json.Unmarshal(w.Body.Bytes(), &response)
			assert.NoError(t, err)

			if tt.expectedStatus == http.StatusOK {
				assert.True(t, response["success"].(bool))
				data := response["data"].(map[string]interface{})
				assert.Equal(t, tt.expectedLevel, data["level"])
			} else {
				assert.False(t, response["success"].(bool))
			}
		})
	}
}

func TestSystemHandler_GetLogLevel(t *testing.T) {
	// Initialize logger
	_ = logger.Init("development")
	_ = logger.SetLevel("info")

	gin.SetMode(gin.TestMode)
	handler := NewSystemHandler()

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest("GET", "/system/log-level", nil)

	handler.GetLogLevel(c)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.True(t, response["success"].(bool))

	data := response["data"].(map[string]interface{})
	assert.Equal(t, "info", data["level"])
}
