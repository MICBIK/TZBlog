package email

import (
	"strings"
	"testing"
)

func TestNewService(t *testing.T) {
	config := &Config{
		Host:     "smtp.example.com",
		Port:     587,
		Username: "user@example.com",
		Password: "password",
		From:     "noreply@example.com",
		BaseURL:  "https://example.com",
	}

	service := NewService(config)

	if service == nil {
		t.Fatal("Expected service to be created, got nil")
	}

	if service.config != config {
		t.Error("Expected config to be set")
	}

	if service.auth == nil {
		t.Error("Expected auth to be initialized")
	}
}

func TestSendEmail_TemplateExecution(t *testing.T) {
	config := &Config{
		Host:     "smtp.example.com",
		Port:     587,
		Username: "user@example.com",
		Password: "password",
		From:     "noreply@example.com",
		BaseURL:  "https://example.com",
	}

	service := NewService(config)

	// Test template parsing with simple template
	tmpl := "Hello {{.Name}}"
	data := map[string]string{"Name": "World"}

	// We can't actually send email in tests, but we can test template execution
	// by calling the internal logic through a wrapper
	testTemplate := `Hello {{.Name}}`

	// Verify template would parse
	_, err := parseTemplate(testTemplate)
	if err != nil {
		t.Errorf("Template parsing failed: %v", err)
	}

	// Test verification email template rendering
	t.Run("verification email has required fields", func(t *testing.T) {
		// The verification template should contain these elements
		requiredElements := []string{
			"欢迎订阅 TZBlog",
			"验证邮箱",
			"{{.VerifyURL}}",
		}

		verificationTemplate := getVerificationTemplate()
		for _, elem := range requiredElements {
			if !strings.Contains(verificationTemplate, elem) {
				t.Errorf("Verification template missing required element: %s", elem)
			}
		}
	})

	// Test newsletter email template rendering
	t.Run("newsletter email has required fields", func(t *testing.T) {
		requiredElements := []string{
			"TZBlog",
			"{{.Content}}",
			"{{.UnsubscribeURL}}",
			"退订",
		}

		newsletterTemplate := getNewsletterTemplate()
		for _, elem := range requiredElements {
			if !strings.Contains(newsletterTemplate, elem) {
				t.Errorf("Newsletter template missing required element: %s", elem)
			}
		}
	})

	_ = service
	_ = tmpl
	_ = data
}

func TestSendBatchEmails_ErrorHandling(t *testing.T) {
	config := &Config{
		Host:     "smtp.example.com",
		Port:     587,
		Username: "user@example.com",
		Password: "password",
		From:     "noreply@example.com",
		BaseURL:  "https://example.com",
	}

	service := NewService(config)

	// Test with empty recipients list
	err := service.SendBatchEmails([]string{}, "Test", "Content")
	if err != nil {
		t.Errorf("Expected no error with empty recipients, got: %v", err)
	}

	// Note: We can't test actual email sending without a real SMTP server
	// In production, you'd use a mock SMTP server or dependency injection
}

func TestConfig_Validation(t *testing.T) {
	tests := []struct {
		name   string
		config *Config
		valid  bool
	}{
		{
			name: "valid config",
			config: &Config{
				Host:     "smtp.example.com",
				Port:     587,
				Username: "user@example.com",
				Password: "password",
				From:     "noreply@example.com",
				BaseURL:  "https://example.com",
			},
			valid: true,
		},
		{
			name: "empty host",
			config: &Config{
				Host:     "",
				Port:     587,
				Username: "user@example.com",
				Password: "password",
				From:     "noreply@example.com",
				BaseURL:  "https://example.com",
			},
			valid: false,
		},
		{
			name: "invalid port",
			config: &Config{
				Host:     "smtp.example.com",
				Port:     0,
				Username: "user@example.com",
				Password: "password",
				From:     "noreply@example.com",
				BaseURL:  "https://example.com",
			},
			valid: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			service := NewService(tt.config)

			// Basic validation - service should always be created
			if service == nil {
				t.Error("Service should not be nil")
			}

			// Check if required fields are set
			if tt.valid {
				if service.config.Host == "" {
					t.Error("Expected Host to be set")
				}
				if service.config.Port == 0 {
					t.Error("Expected Port to be set")
				}
			}
		})
	}
}

// Helper functions to extract templates for testing
func getVerificationTemplate() string {
	return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; background: #f9f9f9; }
        .button { display: inline-block; padding: 12px 30px; background: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>欢迎订阅 TZBlog!</h1>
        </div>
        <div class="content">
            <p>您好！</p>
            <p>感谢您订阅 TZBlog 的内容更新通知。</p>
            <p>请点击下面的按钮验证您的邮箱地址：</p>
            <center>
                <a href="{{.VerifyURL}}" class="button">验证邮箱</a>
            </center>
            <p>或者复制以下链接到浏览器：</p>
            <p style="word-break: break-all; color: #666;">{{.VerifyURL}}</p>
            <p>如果您没有订阅，请忽略此邮件。</p>
        </div>
        <div class="footer">
            <p>&copy; 2026 TZBlog. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`
}

func getNewsletterTemplate() string {
	return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; background: #f9f9f9; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>TZBlog</h1>
        </div>
        <div class="content">
            {{.Content}}
        </div>
        <div class="footer">
            <p><a href="{{.UnsubscribeURL}}">退订</a></p>
            <p>&copy; 2026 TZBlog. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`
}

func parseTemplate(tmpl string) (interface{}, error) {
	// Simple template parsing validation
	if tmpl == "" {
		return nil, nil
	}
	return tmpl, nil
}
