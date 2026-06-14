package sanitizer

import (
	"github.com/microcosm-cc/bluemonday"
)

// HTMLSanitizer 提供 HTML 清理功能，防止 XSS 攻击
type HTMLSanitizer struct {
	strictPolicy *bluemonday.Policy
	ugcPolicy    *bluemonday.Policy
}

// NewHTMLSanitizer 创建 HTML 清理器实例
func NewHTMLSanitizer() *HTMLSanitizer {
	return &HTMLSanitizer{
		strictPolicy: bluemonday.StrictPolicy(),
		ugcPolicy:    bluemonday.UGCPolicy(),
	}
}

// SanitizeStrict 严格清理，移除所有 HTML 标签
// 适用于: 用户名、邮箱、标题等纯文本字段
func (s *HTMLSanitizer) SanitizeStrict(input string) string {
	return s.strictPolicy.Sanitize(input)
}

// SanitizeUGC 清理用户生成内容，保留安全的 HTML 标签
// 适用于: 文章内容、评论等富文本字段
// 允许的标签: p, br, strong, em, u, a, ul, ol, li, blockquote, code, pre 等
func (s *HTMLSanitizer) SanitizeUGC(input string) string {
	return s.ugcPolicy.Sanitize(input)
}

// SanitizeComment 清理评论内容
// 比 UGC 更严格，不允许链接和复杂格式
func (s *HTMLSanitizer) SanitizeComment(input string) string {
	policy := bluemonday.NewPolicy()

	// 只允许基本格式化标签
	policy.AllowElements("p", "br", "strong", "em", "code")

	return policy.Sanitize(input)
}

// 全局默认实例
var defaultSanitizer = NewHTMLSanitizer()

// SanitizeStrict 使用默认实例进行严格清理
func SanitizeStrict(input string) string {
	return defaultSanitizer.SanitizeStrict(input)
}

// SanitizeUGC 使用默认实例清理用户生成内容
func SanitizeUGC(input string) string {
	return defaultSanitizer.SanitizeUGC(input)
}

// SanitizeComment 使用默认实例清理评论
func SanitizeComment(input string) string {
	return defaultSanitizer.SanitizeComment(input)
}
