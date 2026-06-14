package storage

import (
	"bytes"
	"strings"
	"testing"
)

func TestValidateFile_ImageTypes(t *testing.T) {
	validator := NewImageValidator(5) // 5MB max

	tests := []struct {
		name        string
		content     []byte
		filename    string
		size        int64
		shouldError bool
	}{
		{
			name:        "valid JPEG",
			content:     []byte{0xFF, 0xD8, 0xFF}, // JPEG magic bytes
			filename:    "test.jpg",
			size:        1024,
			shouldError: false,
		},
		{
			name:        "valid PNG",
			content:     []byte{0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A}, // PNG magic bytes
			filename:    "test.png",
			size:        1024,
			shouldError: false,
		},
		{
			name:        "invalid file type - executable disguised as image",
			content:     []byte{0x4D, 0x5A}, // EXE magic bytes
			filename:    "test.jpg",
			size:        1024,
			shouldError: true,
		},
		{
			name:        "empty file",
			content:     []byte{},
			filename:    "test.jpg",
			size:        0,
			shouldError: true,
		},
		{
			name:        "file too large",
			content:     []byte{0xFF, 0xD8, 0xFF},
			filename:    "test.jpg",
			size:        6 * 1024 * 1024, // 6MB
			shouldError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			reader := bytes.NewReader(tt.content)
			err := validator.ValidateFile(reader, tt.filename, tt.size)

			if tt.shouldError && err == nil {
				t.Errorf("ValidateFile() expected error but got none")
			}
			if !tt.shouldError && err != nil {
				t.Errorf("ValidateFile() unexpected error: %v", err)
			}
		})
	}
}

func TestIsAllowedType(t *testing.T) {
	validator := NewImageValidator(5)

	tests := []struct {
		mimeType string
		allowed  bool
	}{
		{"image/jpeg", true},
		{"image/png", true},
		{"image/gif", true},
		{"image/webp", true},
		{"image/svg+xml", false},
		{"application/x-executable", false},
		{"text/html", false},
		{"application/javascript", false},
	}

	for _, tt := range tests {
		t.Run(tt.mimeType, func(t *testing.T) {
			result := validator.isAllowedType(tt.mimeType)
			if result != tt.allowed {
				t.Errorf("isAllowedType(%q) = %v, want %v", tt.mimeType, result, tt.allowed)
			}
		})
	}
}

func TestIsExtensionMatchContentType(t *testing.T) {
	validator := NewImageValidator(5)

	tests := []struct {
		name        string
		ext         string
		mimeType    string
		shouldMatch bool
	}{
		{
			name:        "JPEG extension matches JPEG content",
			ext:         ".jpg",
			mimeType:    "image/jpeg",
			shouldMatch: true,
		},
		{
			name:        "PNG extension matches PNG content",
			ext:         ".png",
			mimeType:    "image/png",
			shouldMatch: true,
		},
		{
			name:        "JPG extension with JPEG mime type",
			ext:         ".jpeg",
			mimeType:    "image/jpeg",
			shouldMatch: true,
		},
		{
			name:        "extension mismatch - jpg extension with png content",
			ext:         ".jpg",
			mimeType:    "image/png",
			shouldMatch: false,
		},
		{
			name:        "extension mismatch - image extension with executable content",
			ext:         ".jpg",
			mimeType:    "application/x-executable",
			shouldMatch: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := validator.isExtensionMatchContentType(tt.ext, tt.mimeType)
			if result != tt.shouldMatch {
				t.Errorf("isExtensionMatchContentType(%q, %q) = %v, want %v", tt.ext, tt.mimeType, result, tt.shouldMatch)
			}
		})
	}
}

func TestGetSafeFilename(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{
			input:    "normal_file.jpg",
			expected: "normal_file.jpg",
		},
		{
			input:    "file with spaces.png",
			expected: "file_with_spaces.png",
		},
		{
			input:    "../../etc/passwd",
			expected: "passwd",
		},
		{
			input:    ".hidden_file.txt",
			expected: "hidden_file.txt",
		},
		{
			input:    "../../../etc/shadow",
			expected: "shadow",
		},
		{
			input:    "file\x00name.jpg",
			expected: "filename.jpg",
		},
		{
			input:    "/absolute/path/file.pdf",
			expected: "file.pdf",
		},
		{
			input:    "windows\\path\\file.doc",
			expected: "windowspathfile.doc", // On Unix, backslash is not a separator
		},
	}

	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			result := GetSafeFilename(tt.input)
			if result != tt.expected {
				t.Errorf("GetSafeFilename(%q) = %q, want %q", tt.input, result, tt.expected)
			}
		})
	}
}

func TestValidateFile_MaliciousFiles(t *testing.T) {
	validator := NewImageValidator(5)

	// Test common attack vectors
	attackVectors := []struct {
		name     string
		content  []byte
		filename string
	}{
		{
			name:     "PHP file disguised as JPEG",
			content:  []byte("<?php system($_GET['cmd']); ?>"),
			filename: "shell.jpg",
		},
		{
			name:     "HTML file disguised as PNG",
			content:  []byte("<html><script>alert('xss')</script></html>"),
			filename: "xss.png",
		},
		{
			name:     "JavaScript disguised as image",
			content:  []byte("alert('xss');"),
			filename: "malicious.gif",
		},
	}

	for _, av := range attackVectors {
		t.Run(av.name, func(t *testing.T) {
			reader := strings.NewReader(string(av.content))
			err := validator.ValidateFile(reader, av.filename, int64(len(av.content)))

			if err == nil {
				t.Errorf("ValidateFile() should reject malicious file %q but accepted it", av.name)
			}
		})
	}
}
