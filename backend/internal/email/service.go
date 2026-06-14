package email

import (
	"bytes"
	"fmt"
	"html/template"
	"net/smtp"
)

// Config represents email configuration
type Config struct {
	Host     string
	Port     int
	Username string
	Password string
	From     string
	BaseURL  string
}

// Service represents an email service
type Service struct {
	config *Config
	auth   smtp.Auth
}

// NewService creates a new email service
func NewService(config *Config) *Service {
	auth := smtp.PlainAuth("", config.Username, config.Password, config.Host)
	return &Service{
		config: config,
		auth:   auth,
	}
}

// SendVerificationEmail sends a verification email
func (s *Service) SendVerificationEmail(to, token string) error {
	verifyURL := fmt.Sprintf("%s/subscribe/verify?token=%s", s.config.BaseURL, token)

	tmpl := `
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

	data := map[string]string{
		"VerifyURL": verifyURL,
	}

	return s.sendEmail(to, "验证您的 TZBlog 订阅", tmpl, data)
}

// SendNewsletterEmail sends a newsletter email
func (s *Service) SendNewsletterEmail(to, subject, content string) error {
	tmpl := `
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

	data := map[string]interface{}{
		"Content":        template.HTML(content),
		"UnsubscribeURL": s.config.BaseURL + "/unsubscribe",
	}

	return s.sendEmail(to, subject, tmpl, data)
}

// sendEmail sends an email
func (s *Service) sendEmail(to, subject, templateStr string, data interface{}) error {
	// Parse template
	tmpl, err := template.New("email").Parse(templateStr)
	if err != nil {
		return fmt.Errorf("failed to parse template: %w", err)
	}

	// Execute template
	var body bytes.Buffer
	if err := tmpl.Execute(&body, data); err != nil {
		return fmt.Errorf("failed to execute template: %w", err)
	}

	// Compose message
	message := fmt.Sprintf("From: %s\r\n", s.config.From)
	message += fmt.Sprintf("To: %s\r\n", to)
	message += fmt.Sprintf("Subject: %s\r\n", subject)
	message += "MIME-Version: 1.0\r\n"
	message += "Content-Type: text/html; charset=UTF-8\r\n"
	message += "\r\n"
	message += body.String()

	// Send email
	addr := fmt.Sprintf("%s:%d", s.config.Host, s.config.Port)
	err = smtp.SendMail(addr, s.auth, s.config.From, []string{to}, []byte(message))
	if err != nil {
		return fmt.Errorf("failed to send email: %w", err)
	}

	return nil
}

// SendBatchEmails sends emails to multiple recipients
func (s *Service) SendBatchEmails(recipients []string, subject, content string) error {
	for _, recipient := range recipients {
		if err := s.SendNewsletterEmail(recipient, subject, content); err != nil {
			// Log error but continue
			fmt.Printf("Failed to send email to %s: %v\n", recipient, err)
		}
	}
	return nil
}
