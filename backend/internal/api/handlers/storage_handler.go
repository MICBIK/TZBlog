package handlers

import (
	"fmt"
	"mime/multipart"
	"path/filepath"
	"strings"
	"time"

	"github.com/MICBIK/TZBlog/backend/internal/api/response"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// StorageHandler handles file upload requests
type StorageHandler struct {
	// TODO: Add storage client (S3/OSS) when configured
}

// NewStorageHandler creates a new storage handler
func NewStorageHandler() *StorageHandler {
	return &StorageHandler{}
}

// UploadImage handles image upload
// @Summary      Upload an image
// @Description  Upload an image file (jpg, png, gif, webp)
// @Tags         Upload
// @Accept       multipart/form-data
// @Produce      json
// @Security     Bearer
// @Param        file formData file true "Image file"
// @Success      200 {object} response.Response{data=object{url=string,filename=string,size=int}} "Upload successful"
// @Failure      400 {object} response.ErrorResponse "Invalid file or validation failed"
// @Failure      401 {object} response.ErrorResponse "Unauthorized"
// @Failure      500 {object} response.ErrorResponse "Upload failed"
// @Router       /api/v1/uploads/images [post]
func (h *StorageHandler) UploadImage(c *gin.Context) {
	// Get file from request
	file, err := c.FormFile("file")
	if err != nil {
		response.BadRequest(c, "No file uploaded")
		return
	}

	// Validate file
	if err := h.validateImageFile(file); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	// TODO: Upload to S3/OSS when storage is configured
	// For now, generate a placeholder response

	// Generate unique filename
	ext := filepath.Ext(file.Filename)
	filename := fmt.Sprintf("%s-%d%s", uuid.New().String(), time.Now().Unix(), ext)

	// TODO: Replace with actual storage URL after implementing S3/OSS
	url := fmt.Sprintf("https://placehold.co/600x400?text=%s", filename)

	response.Success(c, gin.H{
		"url":      url,
		"filename": filename,
		"size":     file.Size,
		"message":  "Upload successful (using placeholder - TODO: implement S3/OSS)",
	})
}

// validateImageFile validates the uploaded image file
func (h *StorageHandler) validateImageFile(file *multipart.FileHeader) error {
	// Check file size (max 5MB)
	const maxSize = 5 * 1024 * 1024 // 5MB
	if file.Size > maxSize {
		return fmt.Errorf("file size exceeds maximum limit of 5MB")
	}

	if file.Size == 0 {
		return fmt.Errorf("file is empty")
	}

	// Check file extension
	ext := strings.ToLower(filepath.Ext(file.Filename))
	allowedExts := map[string]bool{
		".jpg":  true,
		".jpeg": true,
		".png":  true,
		".gif":  true,
		".webp": true,
	}

	if !allowedExts[ext] {
		return fmt.Errorf("invalid file type: %s (allowed: jpg, jpeg, png, gif, webp)", ext)
	}

	// TODO: Add MIME type validation when storage.Validator is available

	return nil
}

// GetUploadConfig returns upload configuration
// @Summary      Get upload configuration
// @Description  Get upload size limits and allowed file types
// @Tags         Upload
// @Produce      json
// @Success      200 {object} response.Response{data=object{maxSize=int,allowedTypes=[]string}} "Upload config"
// @Router       /api/v1/uploads/config [get]
func (h *StorageHandler) GetUploadConfig(c *gin.Context) {
	response.Success(c, gin.H{
		"maxSize": 5 * 1024 * 1024, // 5MB
		"allowedTypes": []string{
			"image/jpeg",
			"image/png",
			"image/gif",
			"image/webp",
		},
		"allowedExtensions": []string{".jpg", ".jpeg", ".png", ".gif", ".webp"},
	})
}
