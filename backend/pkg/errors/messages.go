package errors

// ErrorMessages contains localized error messages for each error code
var ErrorMessages = map[string]map[string]string{
	// Authentication & Authorization
	"UNAUTHORIZED": {
		"en":    "Authentication required",
		"zh":    "需要登录认证",
		"zh-TW": "需要登入認證",
		"ja":    "認証が必要です",
		"ko":    "인증이 필요합니다",
	},
	"FORBIDDEN": {
		"en":    "Permission denied",
		"zh":    "权限不足",
		"zh-TW": "權限不足",
		"ja":    "アクセスが拒否されました",
		"ko":    "권한이 거부되었습니다",
	},
	"INVALID_TOKEN": {
		"en":    "Invalid or expired token",
		"zh":    "Token 无效或已过期",
		"zh-TW": "Token 無效或已過期",
		"ja":    "トークンが無効または期限切れです",
		"ko":    "토큰이 유효하지 않거나 만료되었습니다",
	},
	"TOKEN_REVOKED": {
		"en":    "Token has been revoked",
		"zh":    "Token 已被撤销",
		"zh-TW": "Token 已被撤銷",
		"ja":    "トークンが取り消されました",
		"ko":    "토큰이 취소되었습니다",
	},
	"INVALID_CREDENTIALS": {
		"en":    "Invalid email or password",
		"zh":    "邮箱或密码错误",
		"zh-TW": "郵箱或密碼錯誤",
		"ja":    "メールアドレスまたはパスワードが無効です",
		"ko":    "이메일 또는 비밀번호가 잘못되었습니다",
	},

	// Article errors
	"ARTICLE_NOT_FOUND": {
		"en":    "Article not found",
		"zh":    "文章不存在",
		"zh-TW": "文章不存在",
		"ja":    "記事が見つかりません",
		"ko":    "게시글을 찾을 수 없습니다",
	},
	"ARTICLE_SLUG_EXISTS": {
		"en":    "Article slug already exists",
		"zh":    "文章 slug 已存在",
		"zh-TW": "文章 slug 已存在",
		"ja":    "記事のスラッグは既に存在します",
		"ko":    "게시글 슬러그가 이미 존재합니다",
	},
	"INVALID_ARTICLE_STATUS": {
		"en":    "Invalid article status",
		"zh":    "无效的文章状态",
		"zh-TW": "無效的文章狀態",
		"ja":    "無効な記事のステータスです",
		"ko":    "잘못된 게시글 상태입니다",
	},

	// User errors
	"USER_NOT_FOUND": {
		"en":    "User not found",
		"zh":    "用户不存在",
		"zh-TW": "用戶不存在",
		"ja":    "ユーザーが見つかりません",
		"ko":    "사용자를 찾을 수 없습니다",
	},
	"USER_EXISTS": {
		"en":    "User already exists",
		"zh":    "用户已存在",
		"zh-TW": "用戶已存在",
		"ja":    "ユーザーは既に存在します",
		"ko":    "사용자가 이미 존재합니다",
	},
	"INVALID_EMAIL": {
		"en":    "Invalid email address",
		"zh":    "邮箱格式无效",
		"zh-TW": "郵箱格式無效",
		"ja":    "無効なメールアドレスです",
		"ko":    "잘못된 이메일 주소입니다",
	},
	"WEAK_PASSWORD": {
		"en":    "Password is too weak",
		"zh":    "密码强度不足",
		"zh-TW": "密碼強度不足",
		"ja":    "パスワードが弱すぎます",
		"ko":    "비밀번호가 너무 약합니다",
	},

	// Comment errors
	"COMMENT_NOT_FOUND": {
		"en":    "Comment not found",
		"zh":    "评论不存在",
		"zh-TW": "評論不存在",
		"ja":    "コメントが見つかりません",
		"ko":    "댓글을 찾을 수 없습니다",
	},
	"COMMENT_DELETED": {
		"en":    "Comment has been deleted",
		"zh":    "评论已被删除",
		"zh-TW": "評論已被刪除",
		"ja":    "コメントが削除されました",
		"ko":    "댓글이 삭제되었습니다",
	},

	// Category & Tag errors
	"CATEGORY_NOT_FOUND": {
		"en":    "Category not found",
		"zh":    "分类不存在",
		"zh-TW": "分類不存在",
		"ja":    "カテゴリが見つかりません",
		"ko":    "카테고리를 찾을 수 없습니다",
	},
	"TAG_NOT_FOUND": {
		"en":    "Tag not found",
		"zh":    "标签不存在",
		"zh-TW": "標籤不存在",
		"ja":    "タグが見つかりません",
		"ko":    "태그를 찾을 수 없습니다",
	},

	// Subscription errors
	"SUBSCRIPTION_NOT_FOUND": {
		"en":    "Subscription not found",
		"zh":    "订阅不存在",
		"zh-TW": "訂閱不存在",
		"ja":    "サブスクリプションが見つかりません",
		"ko":    "구독을 찾을 수 없습니다",
	},
	"ALREADY_SUBSCRIBED": {
		"en":    "Email already subscribed",
		"zh":    "邮箱已订阅",
		"zh-TW": "郵箱已訂閱",
		"ja":    "メールアドレスは既に登録されています",
		"ko":    "이메일이 이미 구독 중입니다",
	},
	"INVALID_VERIFICATION_TOKEN": {
		"en":    "Invalid verification token",
		"zh":    "验证 token 无效",
		"zh-TW": "驗證 token 無效",
		"ja":    "検証トークンが無効です",
		"ko":    "잘못된 인증 토큰입니다",
	},

	// Payment errors
	"PAYMENT_FAILED": {
		"en":    "Payment processing failed",
		"zh":    "支付处理失败",
		"zh-TW": "支付處理失敗",
		"ja":    "支払い処理に失敗しました",
		"ko":    "결제 처리에 실패했습니다",
	},
	"INVALID_AMOUNT": {
		"en":    "Invalid payment amount",
		"zh":    "无效的支付金额",
		"zh-TW": "無效的支付金額",
		"ja":    "無効な支払い金額です",
		"ko":    "잘못된 결제 금액입니다",
	},
	"ORDER_NOT_FOUND": {
		"en":    "Order not found",
		"zh":    "订单不存在",
		"zh-TW": "訂單不存在",
		"ja":    "注文が見つかりません",
		"ko":    "주문을 찾을 수 없습니다",
	},

	// File upload errors
	"INVALID_FILE_TYPE": {
		"en":    "Invalid file type",
		"zh":    "不支持的文件类型",
		"zh-TW": "不支持的文件類型",
		"ja":    "無効なファイルタイプです",
		"ko":    "지원되지 않는 파일 형식입니다",
	},
	"FILE_TOO_LARGE": {
		"en":    "File size exceeds limit",
		"zh":    "文件大小超出限制",
		"zh-TW": "文件大小超出限制",
		"ja":    "ファイルサイズが制限を超えています",
		"ko":    "파일 크기가 제한을 초과했습니다",
	},
	"UPLOAD_FAILED": {
		"en":    "File upload failed",
		"zh":    "文件上传失败",
		"zh-TW": "文件上傳失敗",
		"ja":    "ファイルのアップロードに失敗しました",
		"ko":    "파일 업로드에 실패했습니다",
	},

	// Validation errors
	"INVALID_INPUT": {
		"en":    "Invalid input data",
		"zh":    "无效的输入数据",
		"zh-TW": "無效的輸入數據",
		"ja":    "無効な入力データです",
		"ko":    "잘못된 입력 데이터입니다",
	},
	"MISSING_FIELD": {
		"en":    "Required field is missing",
		"zh":    "缺少必填字段",
		"zh-TW": "缺少必填字段",
		"ja":    "必須フィールドがありません",
		"ko":    "필수 필드가 누락되었습니다",
	},
	"INVALID_FORMAT": {
		"en":    "Invalid data format",
		"zh":    "数据格式无效",
		"zh-TW": "數據格式無效",
		"ja":    "無効なデータ形式です",
		"ko":    "잘못된 데이터 형식입니다",
	},

	// Rate limiting
	"TOO_MANY_REQUESTS": {
		"en":    "Too many requests, please try again later",
		"zh":    "请求过于频繁，请稍后再试",
		"zh-TW": "請求過於頻繁，請稍後再試",
		"ja":    "リクエストが多すぎます。後でもう一度お試しください",
		"ko":    "요청이 너무 많습니다. 나중에 다시 시도해주세요",
	},
	"RATE_LIMIT_EXCEEDED": {
		"en":    "Rate limit exceeded",
		"zh":    "超出速率限制",
		"zh-TW": "超出速率限制",
		"ja":    "レート制限を超えました",
		"ko":    "속도 제한을 초과했습니다",
	},

	// General errors
	"INTERNAL_SERVER_ERROR": {
		"en":    "Internal server error",
		"zh":    "服务器内部错误",
		"zh-TW": "服務器內部錯誤",
		"ja":    "内部サーバーエラー",
		"ko":    "내부 서버 오류",
	},
	"NOT_FOUND": {
		"en":    "Resource not found",
		"zh":    "资源不存在",
		"zh-TW": "資源不存在",
		"ja":    "リソースが見つかりません",
		"ko":    "리소스를 찾을 수 없습니다",
	},
	"BAD_REQUEST": {
		"en":    "Bad request",
		"zh":    "错误的请求",
		"zh-TW": "錯誤的請求",
		"ja":    "不正なリクエストです",
		"ko":    "잘못된 요청입니다",
	},
	"CONFLICT": {
		"en":    "Resource conflict",
		"zh":    "资源冲突",
		"zh-TW": "資源衝突",
		"ja":    "リソースの競合",
		"ko":    "리소스 충돌",
	},
}

// GetLocalizedMessage returns the error message in the specified language
// Falls back to English if the language is not supported
func GetLocalizedMessage(code, lang string) string {
	if messages, ok := ErrorMessages[code]; ok {
		if msg, ok := messages[lang]; ok {
			return msg
		}
		// Fallback to English
		if msg, ok := messages["en"]; ok {
			return msg
		}
	}
	return code
}

// GetAllLocalizedMessages returns all translations for an error code
func GetAllLocalizedMessages(code string) map[string]string {
	if messages, ok := ErrorMessages[code]; ok {
		return messages
	}
	return map[string]string{"en": code}
}
