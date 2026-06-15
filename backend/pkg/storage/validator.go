package storage

import (
	"errors"
	"io"
	"net/http"
	"path/filepath"
	"strings"
)

// Errors
var (
	ErrInvalidFileType = errors.New("invalid file type")
	ErrFileTooLarge    = errors.New("file too large")
	ErrEmptyFile       = errors.New("empty file")
)

// AllowedImageTypes defines allowed image MIME types
var AllowedImageTypes = map[string]bool{
	"image/jpeg": true,
	"image/jpg":  true,
	"image/png":  true,
	"image/gif":  true,
	"image/webp": true,
}

// AllowedDocumentTypes defines allowed document MIME types
var AllowedDocumentTypes = map[string]bool{
	"application/pdf": true,
	"text/plain":      true,
	"text/markdown":   true,
}

// FileValidator validates uploaded files
type FileValidator struct {
	MaxSize      int64           // Maximum file size in bytes
	AllowedTypes map[string]bool // Allowed MIME types
}

// NewImageValidator creates a validator for image uploads
func NewImageValidator(maxSizeMB int) *FileValidator {
	return &FileValidator{
		MaxSize:      int64(maxSizeMB * 1024 * 1024),
		AllowedTypes: AllowedImageTypes,
	}
}

// NewDocumentValidator creates a validator for document uploads
func NewDocumentValidator(maxSizeMB int) *FileValidator {
	return &FileValidator{
		MaxSize:      int64(maxSizeMB * 1024 * 1024),
		AllowedTypes: AllowedDocumentTypes,
	}
}

// ValidateFile validates file content and metadata
func (v *FileValidator) ValidateFile(reader io.Reader, filename string, size int64) error {
	// Check file size
	if size == 0 {
		return ErrEmptyFile
	}
	if size > v.MaxSize {
		return ErrFileTooLarge
	}

	// Read first 512 bytes to detect content type
	buffer := make([]byte, 512)
	n, err := reader.Read(buffer)
	if err != nil && err != io.EOF {
		return err
	}

	// Detect actual MIME type from content
	detectedType := http.DetectContentType(buffer[:n])

	// Validate MIME type
	if !v.isAllowedType(detectedType) {
		return ErrInvalidFileType
	}

	// Additional check: verify extension matches content type
	ext := strings.ToLower(filepath.Ext(filename))
	if !v.isExtensionMatchContentType(ext, detectedType) {
		return ErrInvalidFileType
	}

	return nil
}

// isAllowedType checks if the MIME type is allowed
func (v *FileValidator) isAllowedType(mimeType string) bool {
	// Handle MIME types with charset (e.g., "text/plain; charset=utf-8")
	baseType := strings.Split(mimeType, ";")[0]
	baseType = strings.TrimSpace(baseType)

	return v.AllowedTypes[baseType]
}

// isExtensionMatchContentType verifies that file extension matches detected content type
func (v *FileValidator) isExtensionMatchContentType(ext, mimeType string) bool {
	baseType := strings.Split(mimeType, ";")[0]
	baseType = strings.TrimSpace(baseType)

	// Define extension to MIME type mappings
	extToMime := map[string][]string{
		".jpg":  {"image/jpeg"},
		".jpeg": {"image/jpeg"},
		".png":  {"image/png"},
		".gif":  {"image/gif"},
		".webp": {"image/webp"},
		".pdf":  {"application/pdf"},
		".txt":  {"text/plain"},
		".md":   {"text/plain", "text/markdown"},
	}

	allowedMimes, ok := extToMime[ext]
	if !ok {
		// Unknown extension
		return false
	}

	// Check if detected MIME type matches any allowed type for this extension
	for _, allowed := range allowedMimes {
		if baseType == allowed {
			return true
		}
	}

	return false
}

// GetSafeFilename sanitizes filename to prevent path traversal
func GetSafeFilename(filename string) string {
	// Remove any path separators
	filename = filepath.Base(filename)

	// Remove any leading dots (hidden files)
	filename = strings.TrimLeft(filename, ".")

	// Replace spaces with underscores
	filename = strings.ReplaceAll(filename, " ", "_")

	// Remove any dangerous characters
	dangerous := []string{"..", "/", "\\", "\x00"}
	for _, d := range dangerous {
		filename = strings.ReplaceAll(filename, d, "")
	}

	return filename
}
