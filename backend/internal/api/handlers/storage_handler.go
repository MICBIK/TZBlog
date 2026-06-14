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
	// TODO: Add Cloudflare R2 client (aws-sdk-go-v2, S3-compatible)
	// client *s3.Client
	// bucket string
}

// NewStorageHandler creates a new storage handler
func NewStorageHandler() *StorageHandler {
	return &StorageHandler{}
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

	// Generate unique filename (UUID + timestamp + extension)
	ext := filepath.Ext(file.Filename)
	filename := fmt.Sprintf("%s-%d%s", uuid.New().String(), time.Now().Unix(), ext)

	// TODO: Upload to Cloudflare R2 when configured
	// Implementation steps:
	// 1. Install: go get github.com/aws/aws-sdk-go-v2/service/s3
	// 2. Configure R2 credentials (Account ID, Access Key, Secret Key)
	// 3. Create S3 client pointing to R2 endpoint
	// 4. Upload file using PutObject
	// 5. Return CDN URL
	//
	// Example code:
	// import (
	//     "github.com/aws/aws-sdk-go-v2/config"
	//     "github.com/aws/aws-sdk-go-v2/service/s3"
	//     "github.com/aws/aws-sdk-go-v2/aws"
	// )
	//
	// cfg, _ := config.LoadDefaultConfig(context.Background())
	// client := s3.NewFromConfig(cfg, func(o *s3.Options) {
	//     o.BaseEndpoint = aws.String("https://<account-id>.r2.cloudflarestorage.com")
	// })
	//
	// fileReader, _ := file.Open()
	// defer fileReader.Close()
	//
	// _, err = client.PutObject(context.Background(), &s3.PutObjectInput{
	//     Bucket: aws.String(h.bucket),
	//     Key:    aws.String("images/" + filename),
	//     Body:   fileReader,
	//     ContentType: aws.String("image/" + strings.TrimPrefix(ext, ".")),
	// })
	//
	// Return CDN URL: https://cdn.yourdomain.com/images/{filename}

	// Placeholder URL (replace with actual CDN URL after R2 integration)
	url := fmt.Sprintf("https://cdn.yourdomain.com/images/%s", filename)

	response.Success(c, gin.H{
		"url":      url,
		"filename": filename,
		"size":     file.Size,
		"message":  "Upload successful (Cloudflare R2 integration pending)",
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

	// TODO: Add MIME type validation
	// Open file and check actual content type to prevent extension spoofing

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
		"storage": "Cloudflare R2",
	})
}
