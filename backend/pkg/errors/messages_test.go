package errors

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestGetLocalizedMessage(t *testing.T) {
	tests := []struct {
		name     string
		code     string
		lang     string
		expected string
	}{
		{
			name:     "English message",
			code:     "UNAUTHORIZED",
			lang:     "en",
			expected: "Authentication required",
		},
		{
			name:     "Chinese simplified message",
			code:     "FORBIDDEN",
			lang:     "zh",
			expected: "权限不足",
		},
		{
			name:     "Chinese traditional message",
			code:     "FORBIDDEN",
			lang:     "zh-TW",
			expected: "權限不足",
		},
		{
			name:     "Japanese message",
			code:     "INVALID_TOKEN",
			lang:     "ja",
			expected: "トークンが無効または期限切れです",
		},
		{
			name:     "Korean message",
			code:     "ARTICLE_NOT_FOUND",
			lang:     "ko",
			expected: "게시글을 찾을 수 없습니다",
		},
		{
			name:     "Fallback to English for unsupported language",
			code:     "USER_NOT_FOUND",
			lang:     "fr",
			expected: "User not found",
		},
		{
			name:     "Unknown code returns code itself",
			code:     "UNKNOWN_ERROR",
			lang:     "en",
			expected: "UNKNOWN_ERROR",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := GetLocalizedMessage(tt.code, tt.lang)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestGetAllLocalizedMessages(t *testing.T) {
	t.Run("get all messages for valid code", func(t *testing.T) {
		messages := GetAllLocalizedMessages("UNAUTHORIZED")
		assert.NotNil(t, messages)
		assert.Contains(t, messages, "en")
		assert.Contains(t, messages, "zh")
		assert.Contains(t, messages, "zh-TW")
		assert.Contains(t, messages, "ja")
		assert.Contains(t, messages, "ko")
		assert.Equal(t, "Authentication required", messages["en"])
		assert.Equal(t, "需要登录认证", messages["zh"])
	})

	t.Run("unknown code returns fallback", func(t *testing.T) {
		messages := GetAllLocalizedMessages("UNKNOWN_CODE")
		assert.NotNil(t, messages)
		assert.Contains(t, messages, "en")
		assert.Equal(t, "UNKNOWN_CODE", messages["en"])
	})
}

func TestErrorMessages_Coverage(t *testing.T) {
	// Test that all error codes have at least English translation
	for code, messages := range ErrorMessages {
		t.Run(code, func(t *testing.T) {
			assert.NotEmpty(t, messages, "Code %s has no messages", code)
			assert.Contains(t, messages, "en", "Code %s missing English translation", code)
			assert.NotEmpty(t, messages["en"], "Code %s has empty English message", code)
		})
	}
}

func TestErrorMessages_AllLanguages(t *testing.T) {
	expectedLanguages := []string{"en", "zh", "zh-TW", "ja", "ko"}

	for code, messages := range ErrorMessages {
		t.Run(code, func(t *testing.T) {
			for _, lang := range expectedLanguages {
				assert.Contains(t, messages, lang, "Code %s missing %s translation", code, lang)
				assert.NotEmpty(t, messages[lang], "Code %s has empty %s translation", code, lang)
			}
		})
	}
}

func TestErrorMessages_CommonCodes(t *testing.T) {
	// Test that common error codes exist
	commonCodes := []string{
		"UNAUTHORIZED",
		"FORBIDDEN",
		"INVALID_TOKEN",
		"ARTICLE_NOT_FOUND",
		"USER_NOT_FOUND",
		"INVALID_INPUT",
		"INTERNAL_SERVER_ERROR",
		"TOO_MANY_REQUESTS",
		"NOT_FOUND",
		"BAD_REQUEST",
	}

	for _, code := range commonCodes {
		t.Run(code, func(t *testing.T) {
			assert.Contains(t, ErrorMessages, code, "Missing common error code: %s", code)
		})
	}
}

func TestGetLocalizedMessage_EmptyInputs(t *testing.T) {
	t.Run("empty code", func(t *testing.T) {
		result := GetLocalizedMessage("", "en")
		assert.Equal(t, "", result)
	})

	t.Run("empty language", func(t *testing.T) {
		result := GetLocalizedMessage("UNAUTHORIZED", "")
		// Should fallback to English
		assert.Equal(t, "Authentication required", result)
	})

	t.Run("both empty", func(t *testing.T) {
		result := GetLocalizedMessage("", "")
		assert.Equal(t, "", result)
	})
}
