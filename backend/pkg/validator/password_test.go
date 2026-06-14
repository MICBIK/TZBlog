package validator

import (
	"strings"
	"testing"
)

func TestDefaultPasswordPolicy(t *testing.T) {
	policy := DefaultPasswordPolicy()

	if policy.MinLength != 8 {
		t.Errorf("Expected MinLength to be 8, got %d", policy.MinLength)
	}

	if !policy.RequireUpper {
		t.Error("Expected RequireUpper to be true")
	}

	if !policy.RequireLower {
		t.Error("Expected RequireLower to be true")
	}

	if !policy.RequireDigit {
		t.Error("Expected RequireDigit to be true")
	}

	if !policy.RequireSpecial {
		t.Error("Expected RequireSpecial to be true")
	}
}

func TestValidatePassword(t *testing.T) {
	policy := DefaultPasswordPolicy()

	tests := []struct {
		name        string
		password    string
		shouldError bool
		errorMsg    string
	}{
		{
			name:        "Valid password",
			password:    "MyP@ssw0rd",
			shouldError: false,
		},
		{
			name:        "Valid complex password",
			password:    "Str0ng!Pass",
			shouldError: false,
		},
		{
			name:        "Too short",
			password:    "Te@1",
			shouldError: true,
			errorMsg:    "密码长度至少为 8 位",
		},
		{
			name:        "Too long",
			password:    strings.Repeat("A", 129) + "@1a",
			shouldError: true,
			errorMsg:    "密码长度不能超过 128 位",
		},
		{
			name:        "Missing uppercase",
			password:    "test@123",
			shouldError: true,
			errorMsg:    "密码必须包含至少一个大写字母",
		},
		{
			name:        "Missing lowercase",
			password:    "TEST@123",
			shouldError: true,
			errorMsg:    "密码必须包含至少一个小写字母",
		},
		{
			name:        "Missing digit",
			password:    "Test@test",
			shouldError: true,
			errorMsg:    "密码必须包含至少一个数字",
		},
		{
			name:        "Missing special character",
			password:    "Test1234",
			shouldError: true,
			errorMsg:    "密码必须包含至少一个特殊字符",
		},
		{
			name:        "Contains forbidden word - password",
			password:    "Password@123",
			shouldError: true,
			errorMsg:    "密码不能包含常见词汇: password",
		},
		{
			name:        "Contains forbidden word - admin",
			password:    "Admin@123",
			shouldError: true,
			errorMsg:    "密码不能包含常见词汇: admin",
		},
		{
			name:        "Sequential characters - abc",
			password:    "Axyz@678",
			shouldError: true,
			errorMsg:    "密码不能包含连续字符",
		},
		{
			name:        "Sequential characters - 123",
			password:    "Axyz@6789",
			shouldError: true,
			errorMsg:    "密码不能包含连续字符",
		},
		{
			name:        "Repeating characters",
			password:    "Abbb@5679",
			shouldError: true,
			errorMsg:    "密码不能包含3个或以上连续重复字符",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := policy.ValidatePassword(tt.password)

			if tt.shouldError {
				if err == nil {
					t.Errorf("Expected error but got none")
				} else if !strings.Contains(err.Error(), tt.errorMsg) {
					t.Errorf("Expected error message to contain '%s', got '%s'", tt.errorMsg, err.Error())
				}
			} else {
				if err != nil {
					t.Errorf("Expected no error but got: %v", err)
				}
			}
		})
	}
}

func TestValidateEmail(t *testing.T) {
	tests := []struct {
		name        string
		email       string
		shouldError bool
		errorMsg    string
	}{
		{
			name:        "Valid email",
			email:       "user@example.com",
			shouldError: false,
		},
		{
			name:        "Valid email with subdomain",
			email:       "user@mail.example.com",
			shouldError: false,
		},
		{
			name:        "Valid email with plus",
			email:       "user+tag@example.com",
			shouldError: false,
		},
		{
			name:        "Empty email",
			email:       "",
			shouldError: true,
			errorMsg:    "邮箱不能为空",
		},
		{
			name:        "Too long",
			email:       strings.Repeat("a", 250) + "@test.com",
			shouldError: true,
			errorMsg:    "邮箱长度不能超过 254 个字符",
		},
		{
			name:        "Invalid format - no @",
			email:       "userexample.com",
			shouldError: true,
			errorMsg:    "邮箱格式不正确",
		},
		{
			name:        "Invalid format - no domain",
			email:       "user@",
			shouldError: true,
			errorMsg:    "邮箱格式不正确",
		},
		{
			name:        "Invalid format - no TLD",
			email:       "user@example",
			shouldError: true,
			errorMsg:    "邮箱格式不正确",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateEmail(tt.email)

			if tt.shouldError {
				if err == nil {
					t.Errorf("Expected error but got none")
				} else if !strings.Contains(err.Error(), tt.errorMsg) {
					t.Errorf("Expected error message to contain '%s', got '%s'", tt.errorMsg, err.Error())
				}
			} else {
				if err != nil {
					t.Errorf("Expected no error but got: %v", err)
				}
			}
		})
	}
}

func TestValidateUsername(t *testing.T) {
	tests := []struct {
		name        string
		username    string
		shouldError bool
		errorMsg    string
	}{
		{
			name:        "Valid username",
			username:    "user123",
			shouldError: false,
		},
		{
			name:        "Valid username with underscore",
			username:    "user_name",
			shouldError: false,
		},
		{
			name:        "Valid username with dash",
			username:    "user-name",
			shouldError: false,
		},
		{
			name:        "Empty username",
			username:    "",
			shouldError: true,
			errorMsg:    "用户名不能为空",
		},
		{
			name:        "Too short",
			username:    "ab",
			shouldError: true,
			errorMsg:    "用户名长度至少为 3 位",
		},
		{
			name:        "Too long",
			username:    strings.Repeat("a", 33),
			shouldError: true,
			errorMsg:    "用户名长度不能超过 32 位",
		},
		{
			name:        "Invalid characters - space",
			username:    "user name",
			shouldError: true,
			errorMsg:    "用户名只能包含字母、数字、下划线和连字符",
		},
		{
			name:        "Invalid characters - special",
			username:    "user@name",
			shouldError: true,
			errorMsg:    "用户名只能包含字母、数字、下划线和连字符",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateUsername(tt.username)

			if tt.shouldError {
				if err == nil {
					t.Errorf("Expected error but got none")
				} else if !strings.Contains(err.Error(), tt.errorMsg) {
					t.Errorf("Expected error message to contain '%s', got '%s'", tt.errorMsg, err.Error())
				}
			} else {
				if err != nil {
					t.Errorf("Expected no error but got: %v", err)
				}
			}
		})
	}
}

func TestIsSequential(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected bool
	}{
		{"abc", "abc", true},
		{"ABC", "ABC", true},
		{"123", "123", true},
		{"xyz", "xyz", true},
		{"qwe", "qwe", true},
		{"asd", "asd", true},
		{"zxc", "zxc", true},
		{"cba (reversed)", "cba", true},
		{"321 (reversed)", "321", true},
		{"non-sequential", "axz", false},
		{"too short", "ab", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := isSequential(tt.input)
			if result != tt.expected {
				t.Errorf("isSequential(%s) = %v, expected %v", tt.input, result, tt.expected)
			}
		})
	}
}

func TestHasRepeatingChars(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		count    int
		expected bool
	}{
		{"aaa", "aaa", 3, true},
		{"aaab", "aaab", 3, true},
		{"baaa", "baaa", 3, true},
		{"aabb", "aabb", 3, false},
		{"abc", "abc", 3, false},
		{"111", "111", 3, true},
		{"aa", "aa", 3, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := hasRepeatingChars(tt.input, tt.count)
			if result != tt.expected {
				t.Errorf("hasRepeatingChars(%s, %d) = %v, expected %v", tt.input, tt.count, result, tt.expected)
			}
		})
	}
}
