package handlers

import (
	"bytes"
	"encoding/json"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/MICBIK/TZBlog/backend/pkg/storage"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

// mockR2Storage creates a mock R2Storage for testing
func mockR2Storage() *storage.R2Storage {
	// Return nil for tests that don't actually upload
	// Real tests should use testcontainers or mock the storage layer
	return nil
}

func TestStorageHandler_UploadImage(t *testing.T) {
	gin.SetMode(gin.TestMode)

	tests := []struct {
		name           string
		filename       string
		fileSize       int64
		fileContent    []byte
		expectedStatus int
		expectURL      bool
	}{
		{
			name:           "file too large",
			filename:       "large.jpg",
			fileSize:       6 * 1024 * 1024, // 6MB
			fileContent:    make([]byte, 6*1024*1024),
			expectedStatus: http.StatusBadRequest,
			expectURL:      false,
		},
		{
			name:           "invalid file type",
			filename:       "test.exe",
			fileSize:       1024,
			fileContent:    []byte("fake exe content"),
			expectedStatus: http.StatusBadRequest,
			expectURL:      false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Setup
			handler := NewStorageHandler(mockR2Storage())

			// Create multipart form
			body := &bytes.Buffer{}
			writer := multipart.NewWriter(body)
			part, err := writer.CreateFormFile("file", tt.filename)
			assert.NoError(t, err)
			_, err = part.Write(tt.fileContent)
			assert.NoError(t, err)
			writer.Close()

			// Create request
			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			c.Set("user_id", int64(123))
			c.Request = httptest.NewRequest(http.MethodPost, "/api/v1/uploads/images", body)
			c.Request.Header.Set("Content-Type", writer.FormDataContentType())

			// Execute
			handler.UploadImage(c)

			// Assert
			assert.Equal(t, tt.expectedStatus, w.Code)
		})
	}
}

func TestStorageHandler_UploadImage_NoFile(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Setup
	handler := NewStorageHandler(mockR2Storage())

	// Create request without file
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Set("user_id", int64(123))
	c.Request = httptest.NewRequest(http.MethodPost, "/api/v1/uploads/images", nil)

	// Execute
	handler.UploadImage(c)

	// Assert
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestStorageHandler_GetUploadConfig(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Setup
	handler := NewStorageHandler(mockR2Storage())

	// Create request
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodGet, "/api/v1/uploads/config", nil)

	// Execute
	handler.GetUploadConfig(c)

	// Assert
	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)

	data := response["data"].(map[string]interface{})
	assert.Equal(t, float64(5*1024*1024), data["maxSize"])
	assert.NotEmpty(t, data["allowedTypes"])
	assert.NotEmpty(t, data["allowedExtensions"])
	assert.Equal(t, "Cloudflare R2", data["storage"])
}

func TestStorageHandler_validateImageFile(t *testing.T) {
	handler := NewStorageHandler(mockR2Storage())

	tests := []struct {
		name      string
		filename  string
		fileSize  int64
		expectErr bool
	}{
		{
			name:      "valid jpg",
			filename:  "test.jpg",
			fileSize:  1024,
			expectErr: false,
		},
		{
			name:      "valid png",
			filename:  "test.png",
			fileSize:  2048,
			expectErr: false,
		},
		{
			name:      "valid gif",
			filename:  "test.gif",
			fileSize:  1500,
			expectErr: false,
		},
		{
			name:      "valid webp",
			filename:  "test.webp",
			fileSize:  2000,
			expectErr: false,
		},
		{
			name:      "file too large",
			filename:  "large.jpg",
			fileSize:  6 * 1024 * 1024,
			expectErr: true,
		},
		{
			name:      "empty file",
			filename:  "empty.jpg",
			fileSize:  0,
			expectErr: true,
		},
		{
			name:      "invalid extension",
			filename:  "test.exe",
			fileSize:  1024,
			expectErr: true,
		},
		{
			name:      "invalid extension pdf",
			filename:  "doc.pdf",
			fileSize:  1024,
			expectErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			file := &multipart.FileHeader{
				Filename: tt.filename,
				Size:     tt.fileSize,
			}

			err := handler.validateImageFile(file)

			if tt.expectErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}
