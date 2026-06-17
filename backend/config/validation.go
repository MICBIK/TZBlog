package config

import (
	"fmt"
	"math"
	"strings"
)

// Validate validates the configuration based on environment
func Validate(cfg *Config) error {
	if cfg.IsProduction() {
		return ValidateProduction(cfg)
	}
	return ValidateDevelopment(cfg)
}

// ValidateProduction validates configuration for production environment
func ValidateProduction(cfg *Config) error {
	// 1. HTTPS enforcement
	if err := ValidateHTTPS(cfg.Server.BaseURL); err != nil {
		return fmt.Errorf("生产环境必须使用 HTTPS\n当前配置: SERVER_BASE_URL=%s\n修复方法: 将 SERVER_BASE_URL 改为 https://...", cfg.Server.BaseURL)
	}

	// 2. JWT Secret validation
	if err := ValidateJWTSecret(cfg.JWT.Secret, true); err != nil {
		return err
	}

	// 3. Database password validation
	if err := ValidatePasswordStrength(cfg.Database.Password, 32, true, "数据库密码"); err != nil {
		return err
	}

	// 4. Redis password validation
	if cfg.Redis.Password == "" {
		return fmt.Errorf("生产环境必须设置 Redis 密码\n修复方法: 设置 REDIS_PASSWORD，推荐使用: openssl rand -base64 24")
	}
	if err := ValidatePasswordStrength(cfg.Redis.Password, 16, true, "Redis 密码"); err != nil {
		return err
	}

	// 5. Database SSL validation
	if cfg.Database.SSLMode != "require" && cfg.Database.SSLMode != "verify-ca" && cfg.Database.SSLMode != "verify-full" {
		return fmt.Errorf("生产环境必须启用数据库 SSL\n当前配置: DB_SSLMODE=%s\n修复方法: 设置 DB_SSLMODE=require", cfg.Database.SSLMode)
	}

	// 6. R2 configuration validation
	if err := ValidateR2Config(&cfg.Storage.R2, true); err != nil {
		return err
	}

	return nil
}

// ValidateDevelopment validates configuration for development environment
func ValidateDevelopment(cfg *Config) error {
	// Development environment: warnings only, no blocking

	// Check JWT Secret (warn if too short)
	if len(cfg.JWT.Secret) < 32 {
		fmt.Printf("⚠️  WARNING: JWT_SECRET 长度不足 32 字符 (当前: %d)\n", len(cfg.JWT.Secret))
		fmt.Println("   推荐生成命令: openssl rand -base64 48")
	}

	// Check Database password (warn if weak)
	if isWeakPassword(cfg.Database.Password) {
		fmt.Printf("⚠️  WARNING: 数据库密码使用了常见弱密码: %s\n", cfg.Database.Password)
		fmt.Println("   推荐生成命令: openssl rand -base64 32")
	}

	// Check HTTPS (warn if HTTP)
	if !strings.HasPrefix(cfg.Server.BaseURL, "https://") {
		fmt.Printf("⚠️  WARNING: 未使用 HTTPS: %s\n", cfg.Server.BaseURL)
		fmt.Println("   生产环境将强制要求 HTTPS")
	}

	return nil
}

// ValidateJWTSecret validates JWT secret strength
func ValidateJWTSecret(secret string, isProduction bool) error {
	if secret == "" {
		return fmt.Errorf("JWT_SECRET 必须设置")
	}

	// Check for default/weak secrets
	weakSecrets := []string{
		"your-secret-key-change-in-production",
		"dev_secret_key_at_least_32_characters_long_12345",
		"secret",
		"changeme",
		"password",
		"12345678",
	}

	for _, weak := range weakSecrets {
		if secret == weak {
			return fmt.Errorf("JWT_SECRET 不能使用默认值或常见弱密钥\n当前值: %s\n修复方法: 使用 openssl rand -base64 48 生成强密钥", weak)
		}
	}

	// Enforce minimum length
	if len(secret) < 32 {
		return fmt.Errorf("JWT_SECRET 长度必须至少 32 字符 (当前: %d 字符)\n修复方法: 使用 openssl rand -base64 48 生成强密钥", len(secret))
	}

	// Production: check entropy
	if isProduction {
		entropy := calculateEntropy(secret)
		if entropy < 4.0 {
			return fmt.Errorf("JWT_SECRET 熵过低 (当前: %.2f, 要求: ≥4.0)\n这意味着密钥复杂度不足，容易被破解\n修复方法: 使用 openssl rand -base64 48 生成高熵密钥", entropy)
		}
	}

	return nil
}

// ValidatePasswordStrength validates password strength
func ValidatePasswordStrength(password string, minLength int, isProduction bool, fieldName string) error {
	if password == "" {
		return fmt.Errorf("%s不能为空", fieldName)
	}

	// Check minimum length
	if len(password) < minLength {
		return fmt.Errorf("%s长度必须至少 %d 字符 (当前: %d 字符)\n修复方法: 使用 openssl rand -base64 %d 生成强密码",
			fieldName, minLength, len(password), minLength)
	}

	// Check for weak passwords
	if isWeakPassword(password) {
		return fmt.Errorf("%s不能使用常见弱密码: %s\n禁止使用: password, admin, postgres, tzblog 等常见词\n修复方法: 使用 openssl rand -base64 %d 生成强密码",
			fieldName, password, minLength)
	}

	// Production: check entropy
	if isProduction {
		entropy := calculateEntropy(password)
		minEntropy := 3.5
		if entropy < minEntropy {
			return fmt.Errorf("%s熵过低 (当前: %.2f, 要求: ≥%.1f)\n这意味着密码复杂度不足，容易被破解\n修复方法: 使用 openssl rand -base64 %d 生成高熵密码",
				fieldName, entropy, minEntropy, minLength)
		}
	}

	return nil
}

// ValidateHTTPS validates that URL uses HTTPS
func ValidateHTTPS(url string) error {
	if !strings.HasPrefix(url, "https://") {
		return fmt.Errorf("URL 必须使用 HTTPS: %s", url)
	}
	return nil
}

// ValidateR2Config validates R2 configuration
func ValidateR2Config(cfg *R2Config, isProduction bool) error {
	if !isProduction {
		return nil // R2 is optional in development
	}

	// Production: all fields required
	if cfg.AccountID == "" {
		return fmt.Errorf("生产环境必须配置 CLOUDFLARE_ACCOUNT_ID")
	}
	if cfg.AccessKeyID == "" || cfg.AccessKeyID == "your_access_key_id_here" {
		return fmt.Errorf("生产环境必须配置 CLOUDFLARE_ACCESS_KEY_ID\n当前值: %s\n修复方法: 从 Cloudflare Dashboard 获取真实的 Access Key ID", cfg.AccessKeyID)
	}
	if cfg.SecretAccessKey == "" || cfg.SecretAccessKey == "your_secret_access_key_here" {
		return fmt.Errorf("生产环境必须配置 CLOUDFLARE_SECRET_ACCESS_KEY\n当前值: %s\n修复方法: 从 Cloudflare Dashboard 获取真实的 Secret Access Key", cfg.SecretAccessKey)
	}
	if cfg.Bucket == "" {
		return fmt.Errorf("生产环境必须配置 R2_BUCKET")
	}
	if cfg.PublicURL == "" {
		return fmt.Errorf("生产环境必须配置 R2_PUBLIC_URL")
	}

	return nil
}

// calculateEntropy calculates Shannon entropy of a string
// Higher entropy means more randomness and better security
// Typical ranges:
//   - Low entropy: <3.0 (weak)
//   - Medium entropy: 3.0-4.0 (acceptable)
//   - High entropy: >4.0 (strong)
func calculateEntropy(s string) float64 {
	if len(s) == 0 {
		return 0
	}

	// Count character frequencies
	freq := make(map[rune]int)
	for _, char := range s {
		freq[char]++
	}

	// Calculate Shannon entropy: H = -Σ(p(x) * log2(p(x)))
	var entropy float64
	length := float64(len(s))

	for _, count := range freq {
		probability := float64(count) / length
		entropy -= probability * math.Log2(probability)
	}

	return entropy
}

// isWeakPassword checks if password is in the weak password list
func isWeakPassword(password string) bool {
	weakPasswords := []string{
		"password",
		"12345678",
		"admin",
		"root",
		"postgres",
		"tzblog",
		"changeme",
		"qwerty",
		"letmein",
		"welcome",
		"password123",
		"admin123",
		"root123",
	}

	lowerPassword := strings.ToLower(password)
	for _, weak := range weakPasswords {
		if lowerPassword == weak {
			return true
		}
	}

	return false
}
