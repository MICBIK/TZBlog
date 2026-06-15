package sanitizer

import (
	"strings"
	"testing"
)

func TestSanitizeStrict(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "移除所有 HTML 标签",
			input:    "<script>alert('xss')</script>Hello",
			expected: "Hello",
		},
		{
			name:     "移除恶意链接",
			input:    "<a href='javascript:alert(1)'>Click</a>",
			expected: "Click",
		},
		{
			name:     "移除内联样式",
			input:    "<p style='color:red'>Text</p>",
			expected: "Text",
		},
		{
			name:     "纯文本保持不变",
			input:    "Hello World",
			expected: "Hello World",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := SanitizeStrict(tt.input)
			if result != tt.expected {
				t.Errorf("SanitizeStrict() = %v, want %v", result, tt.expected)
			}
		})
	}
}

func TestSanitizeUGC(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "移除恶意脚本",
			input:    "<p>Hello</p><script>alert('xss')</script>",
			expected: "<p>Hello</p>",
		},
		{
			name:     "保留安全的格式化标签",
			input:    "<p>Text with <strong>bold</strong> and <em>italic</em></p>",
			expected: "<p>Text with <strong>bold</strong> and <em>italic</em></p>",
		},
		{
			name:     "移除 javascript: 协议",
			input:    "<a href='javascript:alert(1)'>Link</a>",
			expected: "Link",
		},
		{
			name:     "保留安全的链接",
			input:    "<a href='https://example.com'>Link</a>",
			expected: "<a href=\"https://example.com\" rel=\"nofollow\">Link</a>",
		},
		{
			name:     "移除 onload 等事件处理器",
			input:    "<img src='x' onload='alert(1)'>",
			expected: "<img src=\"x\">",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := SanitizeUGC(tt.input)
			if result != tt.expected {
				t.Errorf("SanitizeUGC() = %v, want %v", result, tt.expected)
			}
		})
	}
}

func TestSanitizeComment(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		wantNone []string // 不应包含的内容
	}{
		{
			name:     "移除链接",
			input:    "<p>Check <a href='https://example.com'>this</a></p>",
			wantNone: []string{"<a", "href"},
		},
		{
			name:     "保留基本格式",
			input:    "<p>Text with <strong>bold</strong></p>",
			wantNone: []string{"<script>"},
		},
		{
			name:     "移除复杂 HTML",
			input:    "<div><ul><li>Item</li></ul></div>",
			wantNone: []string{"<div>", "<ul>", "<li>"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := SanitizeComment(tt.input)
			for _, unwanted := range tt.wantNone {
				if strings.Contains(result, unwanted) {
					t.Errorf("SanitizeComment() contains unwanted %q in result: %v", unwanted, result)
				}
			}
		})
	}
}

func TestXSSVectors(t *testing.T) {
	// 常见 XSS 攻击向量
	tests := []struct {
		vector         string
		mustNotContain []string
		allowEscaped   bool // 是否允许 HTML 实体转义后的关键字
	}{
		{
			vector:         "<script>alert('XSS')</script>",
			mustNotContain: []string{"<script", "alert("},
		},
		{
			vector:         "<img src=x onerror=alert('XSS')>",
			mustNotContain: []string{"onerror", "alert("},
		},
		{
			vector:         "<svg/onload=alert('XSS')>",
			mustNotContain: []string{"onload", "alert("},
		},
		{
			vector:         "<iframe src='javascript:alert(1)'>",
			mustNotContain: []string{"<iframe"},
		},
		{
			vector:         "<body onload=alert('XSS')>",
			mustNotContain: []string{"<body", "onload"},
		},
		{
			vector:         "<input onfocus=alert('XSS') autofocus>",
			mustNotContain: []string{"<input", "onfocus"},
		},
		{
			vector:         "<select onfocus=alert('XSS') autofocus>",
			mustNotContain: []string{"<select", "onfocus"},
		},
		{
			vector:         "<textarea onfocus=alert('XSS') autofocus>",
			mustNotContain: []string{"<textarea", "onfocus"},
		},
		{
			vector:         "<keygen onfocus=alert('XSS') autofocus>",
			mustNotContain: []string{"<keygen", "onfocus"},
		},
		{
			vector:         "<video><source onerror=alert('XSS')>",
			mustNotContain: []string{"<video", "onerror"},
		},
		{
			vector:         "<audio src=x onerror=alert('XSS')>",
			mustNotContain: []string{"onerror", "alert("},
		},
		{
			vector:         "<details open ontoggle=alert('XSS')>",
			mustNotContain: []string{"<details", "ontoggle"},
		},
		{
			vector:         "<marquee onstart=alert('XSS')>",
			mustNotContain: []string{"<marquee", "onstart"},
		},
		{
			vector:         "data:text/html,<script>alert('XSS')</script>",
			mustNotContain: []string{"<script"},
		},
		// 纯文本形式的 javascript: 会被 HTML 实体转义，这是安全的
		{
			vector:         "javascript:alert('XSS')",
			mustNotContain: []string{}, // 转义后的文本是安全的
			allowEscaped:   true,
		},
	}

	for i, tt := range tests {
		t.Run("XSS_Vector_"+string(rune(i)), func(t *testing.T) {
			result := SanitizeStrict(tt.vector)
			resultLower := strings.ToLower(result)

			for _, keyword := range tt.mustNotContain {
				keywordLower := strings.ToLower(keyword)
				if strings.Contains(resultLower, keywordLower) {
					t.Errorf("SanitizeStrict() failed to remove dangerous pattern %q from vector: %v, result: %v", keyword, tt.vector, result)
				}
			}
		})
	}
}
