package storage

import (
	"context"
	"fmt"
	"io"
	"mime/multipart"
	"path/filepath"
	"strings"
	"time"

	"github.com/MICBIK/TZBlog/backend/config"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/google/uuid"
)

// R2Storage implements storage using Cloudflare R2
type R2Storage struct {
	client    *s3.Client
	bucket    string
	publicURL string
}

// NewR2Storage creates a new R2 storage instance
func NewR2Storage(cfg *config.R2Config) (*R2Storage, error) {
	if cfg.AccountID == "" {
		return nil, fmt.Errorf("R2 account_id is required")
	}
	if cfg.AccessKeyID == "" {
		return nil, fmt.Errorf("R2 access_key_id is required")
	}
	if cfg.SecretAccessKey == "" {
		return nil, fmt.Errorf("R2 secret_access_key is required")
	}
	if cfg.Bucket == "" {
		return nil, fmt.Errorf("R2 bucket is required")
	}

	// Cloudflare R2 endpoint
	endpoint := fmt.Sprintf("https://%s.r2.cloudflarestorage.com", cfg.AccountID)

	// Create S3 client configured for R2
	client := s3.New(s3.Options{
		Region: "auto", // R2 uses "auto" region
		Credentials: aws.NewCredentialsCache(credentials.NewStaticCredentialsProvider(
			cfg.AccessKeyID,
			cfg.SecretAccessKey,
			"",
		)),
		BaseEndpoint: aws.String(endpoint),
	})

	return &R2Storage{
		client:    client,
		bucket:    cfg.Bucket,
		publicURL: strings.TrimSuffix(cfg.PublicURL, "/"),
	}, nil
}

// UploadImage uploads an image to R2
func (r *R2Storage) UploadImage(ctx context.Context, file *multipart.FileHeader) (string, error) {
	// Generate unique filename
	ext := filepath.Ext(file.Filename)
	filename := fmt.Sprintf("images/%s-%d%s", uuid.New().String(), time.Now().Unix(), ext)

	// Open file
	fileReader, err := file.Open()
	if err != nil {
		return "", fmt.Errorf("failed to open file: %w", err)
	}
	defer fileReader.Close()

	// Read file content
	fileContent, err := io.ReadAll(fileReader)
	if err != nil {
		return "", fmt.Errorf("failed to read file: %w", err)
	}

	// Determine content type
	contentType := "application/octet-stream"
	switch strings.ToLower(ext) {
	case ".jpg", ".jpeg":
		contentType = "image/jpeg"
	case ".png":
		contentType = "image/png"
	case ".gif":
		contentType = "image/gif"
	case ".webp":
		contentType = "image/webp"
	}

	// Upload to R2
	_, err = r.client.PutObject(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(r.bucket),
		Key:         aws.String(filename),
		Body:        strings.NewReader(string(fileContent)),
		ContentType: aws.String(contentType),
		// Make object publicly readable (optional, depends on your bucket policy)
		// ACL: types.ObjectCannedACLPublicRead,
	})

	if err != nil {
		return "", fmt.Errorf("failed to upload to R2: %w", err)
	}

	// Return public URL
	url := fmt.Sprintf("%s/%s", r.publicURL, filename)
	return url, nil
}

// DeleteImage deletes an image from R2
func (r *R2Storage) DeleteImage(ctx context.Context, filename string) error {
	_, err := r.client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(r.bucket),
		Key:    aws.String(filename),
	})

	if err != nil {
		return fmt.Errorf("failed to delete from R2: %w", err)
	}

	return nil
}

// GetImageURL returns the public URL for an image
func (r *R2Storage) GetImageURL(filename string) string {
	return fmt.Sprintf("%s/%s", r.publicURL, filename)
}
