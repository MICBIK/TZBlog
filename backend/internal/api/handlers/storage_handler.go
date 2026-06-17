package handlers

import (
	"context"
	"fmt"
	"mime/multipart"
	"path/filepath"
	"strings"
	"time"

	"github.com/MICBIK/TZBlog/backend/internal/api/response"
	"github.com/MICBIK/TZBlog/backend/pkg/storage"
	"github.com/gin-gonic/gin"
)

// StorageHandler handles file upload requests
type StorageHandler struct {
	r2Storage *storage.R2Storage
}

// NewStorageHandler creates a new storage handler
func NewStorageHandler(r2Storage *storage.R2Storage) *StorageHandler {
	return &StorageHandler{
		r2Storage: r2Storage,
	}
}

// UploadImage handles image upload
// @Summary      Upload an image
// @Description  Upload an image file to Cloudflare R2 (jpg, png, gif, webp)
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

	// Upload to R2
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	url, err := h.r2Storage.UploadImage(ctx, file)
	if err != nil {
		response.InternalError(c, fmt.Sprintf("Failed to upload image: %v", err))
		return
	}

	response.Success(c, gin.H{
		"url":      url,
		"filename": filepath.Base(url),
		"size":     file.Size,
		"message":  "Upload successful",
	})
}

// validateImageFile validates the uploaded image file
func (h *StorageHandler) validateImageFile(file *multipart.FileHeader) error {
	// Check file size (max 5MB as per requirements)
	const maxSize = 5 * 1024 * 1024 // 5MB
	if file.Size > maxSize {
		return fmt.Errorf("file size exceeds maximum limit of 5MB")
	}

	if file.Size == 0 {
		return fmt.Errorf("file is empty")
	}

	// Check file extension (jpg, png, webp as per requirements)
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

	// 基于文件内容的 MIME 校验在 pkg/storage/r2.go 的 UploadImage 完成
	//（读取前 512 字节经 http.DetectContentType 检测真实类型并要求 image/*，防扩展名伪造）。
	// 此处仅做扩展名与大小的快速预校验。

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
		"storage":           "Cloudflare R2",
	})
}
