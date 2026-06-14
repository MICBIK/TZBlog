package handlers

import (
	"bytes"
	"encoding/json"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

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
			name:           "valid jpg file",
			filename:       "test.jpg",
			fileSize:       1024,
			fileContent:    []byte("fake image content"),
			expectedStatus: http.StatusOK,
			expectURL:      true,
		},
		{
			name:           "valid png file",
			filename:       "test.png",
			fileSize:       2048,
			fileContent:    []byte("fake png content"),
			expectedStatus: http.StatusOK,
			expectURL:      true,
		},
		{
			name:           "valid webp file",
			filename:       "test.webp",
			fileSize:       1500,
			fileContent:    []byte("fake webp content"),
			expectedStatus: http.StatusOK,
			expectURL:      true,
		},
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
			handler := NewStorageHandler()

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
			c.Set("userID", int64(123))
			c.Request = httptest.NewRequest(http.MethodPost, "/api/v1/uploads/images", body)
			c.Request.Header.Set("Content-Type", writer.FormDataContentType())

			// Execute
			handler.UploadImage(c)

			// Assert
			assert.Equal(t, tt.expectedStatus, w.Code)

			if tt.expectURL {
				var response map[string]interface{}
				err := json.Unmarshal(w.Body.Bytes(), &response)
				assert.NoError(t, err)

				data := response["data"].(map[string]interface{})
				assert.NotEmpty(t, data["url"])
				assert.NotEmpty(t, data["filename"])
				assert.NotZero(t, data["size"])
			}
		})
	}
}

func TestStorageHandler_UploadImage_NoFile(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Setup
	handler := NewStorageHandler()

	// Create request without file
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Set("userID", int64(123))
	c.Request = httptest.NewRequest(http.MethodPost, "/api/v1/uploads/images", nil)

	// Execute
	handler.UploadImage(c)

	// Assert
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestStorageHandler_GetUploadConfig(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Setup
	handler := NewStorageHandler()

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
	handler := NewStorageHandler()

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
