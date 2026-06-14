package validator

import (
	"fmt"
	"regexp"
	"strings"
	"unicode"
)

// PasswordPolicy 定义密码策略
type PasswordPolicy struct {
	MinLength      int
	RequireUpper   bool
	RequireLower   bool
	RequireDigit   bool
	RequireSpecial bool
	ForbiddenWords []string
}

// DefaultPasswordPolicy 返回默认密码策略
func DefaultPasswordPolicy() *PasswordPolicy {
	return &PasswordPolicy{
		MinLength:      8,
		RequireUpper:   true,
		RequireLower:   true,
		RequireDigit:   true,
		RequireSpecial: true,
		ForbiddenWords: []string{"password", "admin", "user", "test", "12345678"},
	}
}

// PasswordValidationError 密码验证错误
type PasswordValidationError struct {
	Field   string
	Message string
}

func (e *PasswordValidationError) Error() string {
	return fmt.Sprintf("%s: %s", e.Field, e.Message)
}

// ValidatePassword 验证密码强度
func (p *PasswordPolicy) ValidatePassword(password string) error {
	if len(password) < p.MinLength {
		return &PasswordValidationError{
			Field:   "password",
			Message: fmt.Sprintf("密码长度至少为 %d 位", p.MinLength),
		}
	}

	if len(password) > 128 {
		return &PasswordValidationError{
			Field:   "password",
			Message: "密码长度不能超过 128 位",
		}
	}

	var (
		hasUpper   bool
		hasLower   bool
		hasDigit   bool
		hasSpecial bool
	)

	for _, char := range password {
		switch {
		case unicode.IsUpper(char):
			hasUpper = true
		case unicode.IsLower(char):
			hasLower = true
		case unicode.IsDigit(char):
			hasDigit = true
		case unicode.IsPunct(char) || unicode.IsSymbol(char):
			hasSpecial = true
		}
	}

	if p.RequireUpper && !hasUpper {
		return &PasswordValidationError{
			Field:   "password",
			Message: "密码必须包含至少一个大写字母",
		}
	}

	if p.RequireLower && !hasLower {
		return &PasswordValidationError{
			Field:   "password",
			Message: "密码必须包含至少一个小写字母",
		}
	}

	if p.RequireDigit && !hasDigit {
		return &PasswordValidationError{
			Field:   "password",
			Message: "密码必须包含至少一个数字",
		}
	}

	if p.RequireSpecial && !hasSpecial {
		return &PasswordValidationError{
			Field:   "password",
			Message: "密码必须包含至少一个特殊字符",
		}
	}

	// 检查是否包含禁用词
	lowerPassword := strings.ToLower(password)
	for _, word := range p.ForbiddenWords {
		if strings.Contains(lowerPassword, strings.ToLower(word)) {
			return &PasswordValidationError{
				Field:   "password",
				Message: fmt.Sprintf("密码不能包含常见词汇: %s", word),
			}
		}
	}

	// 检查是否为重复字符（先检查，因为重复字符可能也被识别为连续）
	if hasRepeatingChars(password, 3) {
		return &PasswordValidationError{
			Field:   "password",
			Message: "密码不能包含3个或以上连续重复字符",
		}
	}

	// 检查是否为连续字符
	if isSequential(password) {
		return &PasswordValidationError{
			Field:   "password",
			Message: "密码不能包含连续字符（如 abc, 123）",
		}
	}

	return nil
}

// isSequential 检查是否为连续字符
func isSequential(s string) bool {
	if len(s) < 3 {
		return false
	}

	sequences := []string{
		"abcdefghijklmnopqrstuvwxyz",
		"0123456789",
		"qwertyuiop",
		"asdfghjkl",
		"zxcvbnm",
	}

	lowerS := strings.ToLower(s)

	for _, seq := range sequences {
		for i := 0; i <= len(seq)-3; i++ {
			pattern := seq[i : i+3]
			if strings.Contains(lowerS, pattern) {
				return true
			}
			// 检查反向
			reversed := reverseString(pattern)
			if strings.Contains(lowerS, reversed) {
				return true
			}
		}
	}

	return false
}

// hasRepeatingChars 检查是否有连续重复字符
func hasRepeatingChars(s string, count int) bool {
	if len(s) < count {
		return false
	}

	for i := 0; i <= len(s)-count; i++ {
		char := s[i]
		repeating := true
		for j := 1; j < count; j++ {
			if s[i+j] != char {
				repeating = false
				break
			}
		}
		if repeating {
			return true
		}
	}

	return false
}

// reverseString 反转字符串
func reverseString(s string) string {
	runes := []rune(s)
	for i, j := 0, len(runes)-1; i < j; i, j = i+1, j-1 {
		runes[i], runes[j] = runes[j], runes[i]
	}
	return string(runes)
}

// ValidateEmail 验证邮箱格式
func ValidateEmail(email string) error {
	if email == "" {
		return &PasswordValidationError{
			Field:   "email",
			Message: "邮箱不能为空",
		}
	}

	if len(email) > 254 {
		return &PasswordValidationError{
			Field:   "email",
			Message: "邮箱长度不能超过 254 个字符",
		}
	}

	emailRegex := regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`)
	if !emailRegex.MatchString(email) {
		return &PasswordValidationError{
			Field:   "email",
			Message: "邮箱格式不正确",
		}
	}

	return nil
}

// ValidateUsername 验证用户名
func ValidateUsername(username string) error {
	if username == "" {
		return &PasswordValidationError{
			Field:   "username",
			Message: "用户名不能为空",
		}
	}

	if len(username) < 3 {
		return &PasswordValidationError{
			Field:   "username",
			Message: "用户名长度至少为 3 位",
		}
	}

	if len(username) > 32 {
		return &PasswordValidationError{
			Field:   "username",
			Message: "用户名长度不能超过 32 位",
		}
	}

	usernameRegex := regexp.MustCompile(`^[a-zA-Z0-9_\-]+$`)
	if !usernameRegex.MatchString(username) {
		return &PasswordValidationError{
			Field:   "username",
			Message: "用户名只能包含字母、数字、下划线和连字符",
		}
	}

	return nil
}
