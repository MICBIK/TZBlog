# API 错误码文档

## 概述

本文档定义了 TZBlog API 的标准错误码和错误响应格式。

## 错误响应格式

所有 API 错误都遵循统一的响应格式：

```json
{
  "success": false,
  "error": "Error message in English",
  "code": "ERROR_CODE",
  "details": {}  // 可选，提供额外的错误详情
}
```

## HTTP 状态码映射

| HTTP 状态码 | 含义 | 使用场景 |
|------------|------|---------|
| 200 | OK | 成功请求 |
| 201 | Created | 成功创建资源 |
| 400 | Bad Request | 请求参数错误 |
| 401 | Unauthorized | 未认证 |
| 403 | Forbidden | 无权限 |
| 404 | Not Found | 资源不存在 |
| 409 | Conflict | 资源冲突 |
| 429 | Too Many Requests | 请求过于频繁 |
| 500 | Internal Server Error | 服务器内部错误 |

## 错误码分类

### 1. 认证与授权错误 (AUTH_*)

| 错误码 | HTTP 状态码 | 消息 | 说明 |
|--------|------------|------|------|
| `UNAUTHORIZED` | 401 | Authentication required | 需要登录认证 |
| `FORBIDDEN` | 403 | Permission denied | 权限不足 |
| `INVALID_TOKEN` | 401 | Invalid or expired token | Token 无效或已过期 |
| `TOKEN_REVOKED` | 401 | Token has been revoked | Token 已被撤销 |
| `INVALID_CREDENTIALS` | 401 | Invalid email or password | 邮箱或密码错误 |

**示例:**
```json
{
  "success": false,
  "error": "Authentication required",
  "code": "UNAUTHORIZED"
}
```

### 2. 用户错误 (USER_*)

| 错误码 | HTTP 状态码 | 消息 | 说明 |
|--------|------------|------|------|
| `USER_NOT_FOUND` | 404 | User not found | 用户不存在 |
| `USER_EXISTS` | 409 | User already exists | 用户已存在 |
| `INVALID_EMAIL` | 400 | Invalid email address | 邮箱格式无效 |
| `WEAK_PASSWORD` | 400 | Password is too weak | 密码强度不足 |

**示例:**
```json
{
  "success": false,
  "error": "User already exists",
  "code": "USER_EXISTS",
  "details": {
    "email": "user@example.com"
  }
}
```

### 3. 文章错误 (ARTICLE_*)

| 错误码 | HTTP 状态码 | 消息 | 说明 |
|--------|------------|------|------|
| `ARTICLE_NOT_FOUND` | 404 | Article not found | 文章不存在 |
| `ARTICLE_SLUG_EXISTS` | 409 | Article slug already exists | 文章 slug 已存在 |
| `INVALID_ARTICLE_STATUS` | 400 | Invalid article status | 无效的文章状态 |

**示例:**
```json
{
  "success": false,
  "error": "Article not found",
  "code": "ARTICLE_NOT_FOUND",
  "details": {
    "id": 123
  }
}
```

### 4. 评论错误 (COMMENT_*)

| 错误码 | HTTP 状态码 | 消息 | 说明 |
|--------|------------|------|------|
| `COMMENT_NOT_FOUND` | 404 | Comment not found | 评论不存在 |
| `COMMENT_DELETED` | 410 | Comment has been deleted | 评论已被删除 |

**示例:**
```json
{
  "success": false,
  "error": "Comment not found",
  "code": "COMMENT_NOT_FOUND"
}
```

### 5. 分类与标签错误 (CATEGORY_*, TAG_*)

| 错误码 | HTTP 状态码 | 消息 | 说明 |
|--------|------------|------|------|
| `CATEGORY_NOT_FOUND` | 404 | Category not found | 分类不存在 |
| `TAG_NOT_FOUND` | 404 | Tag not found | 标签不存在 |

### 6. 订阅错误 (SUBSCRIPTION_*)

| 错误码 | HTTP 状态码 | 消息 | 说明 |
|--------|------------|------|------|
| `SUBSCRIPTION_NOT_FOUND` | 404 | Subscription not found | 订阅不存在 |
| `ALREADY_SUBSCRIBED` | 409 | Email already subscribed | 邮箱已订阅 |
| `INVALID_VERIFICATION_TOKEN` | 400 | Invalid verification token | 验证 token 无效 |

### 7. 支付错误 (PAYMENT_*)

| 错误码 | HTTP 状态码 | 消息 | 说明 |
|--------|------------|------|------|
| `PAYMENT_FAILED` | 400 | Payment processing failed | 支付处理失败 |
| `INVALID_AMOUNT` | 400 | Invalid payment amount | 无效的支付金额 |
| `ORDER_NOT_FOUND` | 404 | Order not found | 订单不存在 |

### 8. 文件上传错误 (FILE_*)

| 错误码 | HTTP 状态码 | 消息 | 说明 |
|--------|------------|------|------|
| `INVALID_FILE_TYPE` | 400 | Invalid file type | 不支持的文件类型 |
| `FILE_TOO_LARGE` | 400 | File size exceeds limit | 文件大小超出限制 |
| `UPLOAD_FAILED` | 500 | File upload failed | 文件上传失败 |

### 9. 验证错误 (VALIDATION_*)

| 错误码 | HTTP 状态码 | 消息 | 说明 |
|--------|------------|------|------|
| `INVALID_INPUT` | 400 | Invalid input data | 无效的输入数据 |
| `MISSING_FIELD` | 400 | Required field is missing | 缺少必填字段 |
| `INVALID_FORMAT` | 400 | Invalid data format | 数据格式无效 |

**示例:**
```json
{
  "success": false,
  "error": "Invalid input data",
  "code": "INVALID_INPUT",
  "details": {
    "field": "email",
    "reason": "must be a valid email address"
  }
}
```

### 10. 限流错误 (RATE_LIMIT_*)

| 错误码 | HTTP 状态码 | 消息 | 说明 |
|--------|------------|------|------|
| `TOO_MANY_REQUESTS` | 429 | Too many requests, please try again later | 请求过于频繁 |
| `RATE_LIMIT_EXCEEDED` | 429 | Rate limit exceeded | 超出速率限制 |

**示例:**
```json
{
  "success": false,
  "error": "Too many requests, please try again later",
  "code": "TOO_MANY_REQUESTS",
  "details": {
    "retry_after": 60,
    "limit": 100,
    "window": "1m"
  }
}
```

### 11. 通用错误 (GENERAL_*)

| 错误码 | HTTP 状态码 | 消息 | 说明 |
|--------|------------|------|------|
| `INTERNAL_SERVER_ERROR` | 500 | Internal server error | 服务器内部错误 |
| `NOT_FOUND` | 404 | Resource not found | 资源不存在 |
| `BAD_REQUEST` | 400 | Bad request | 错误的请求 |
| `CONFLICT` | 409 | Resource conflict | 资源冲突 |

## 国际化支持 (i18n)

### 多语言错误消息结构

为了支持多语言，错误响应可以包含 `message_i18n` 字段：

```json
{
  "success": false,
  "error": "Authentication required",
  "code": "UNAUTHORIZED",
  "message_i18n": {
    "en": "Authentication required",
    "zh": "需要登录认证",
    "ja": "認証が必要です"
  }
}
```

### 实现建议

1. **客户端语言检测**: 通过 `Accept-Language` 头部获取客户端语言偏好
2. **默认语言**: 英文 (en) 作为默认语言
3. **支持的语言**: 
   - `en`: English (英语)
   - `zh`: 简体中文
   - `zh-TW`: 繁体中文
   - `ja`: Japanese (日语)
   - `ko`: Korean (韩语)

### 实现示例

```go
// pkg/errors/i18n.go
package errors

var messages = map[string]map[string]string{
    "UNAUTHORIZED": {
        "en": "Authentication required",
        "zh": "需要登录认证",
        "ja": "認証が必要です",
    },
    "USER_NOT_FOUND": {
        "en": "User not found",
        "zh": "用户不存在",
        "ja": "ユーザーが見つかりません",
    },
    // ... 更多错误码
}

func (e *AppError) GetLocalizedMessage(lang string) string {
    if msgs, ok := messages[e.Code]; ok {
        if msg, ok := msgs[lang]; ok {
            return msg
        }
        // 回退到英文
        return msgs["en"]
    }
    return e.Message
}
```

## 客户端处理建议

### 1. 通用错误处理

```typescript
interface APIError {
  success: false;
  error: string;
  code: string;
  details?: Record<string, any>;
}

function handleAPIError(error: APIError) {
  switch (error.code) {
    case 'UNAUTHORIZED':
    case 'INVALID_TOKEN':
    case 'TOKEN_REVOKED':
      // 跳转到登录页
      redirectToLogin();
      break;
    
    case 'FORBIDDEN':
      // 显示权限不足提示
      showPermissionDenied();
      break;
    
    case 'RATE_LIMIT_EXCEEDED':
      // 显示限流提示
      showRateLimitMessage(error.details?.retry_after);
      break;
    
    default:
      // 显示通用错误消息
      showErrorMessage(error.error);
  }
}
```

### 2. 表单验证错误处理

```typescript
function handleValidationError(error: APIError) {
  if (error.code === 'INVALID_INPUT' && error.details?.field) {
    // 高亮显示错误字段
    highlightField(error.details.field);
    showFieldError(error.details.field, error.details.reason);
  }
}
```

## 最佳实践

### 1. 错误码命名规范

- 使用 `UPPER_SNAKE_CASE` 格式
- 使用命名空间前缀 (如 `USER_`, `ARTICLE_`)
- 保持简洁且具有描述性

### 2. 错误消息编写规范

- 使用英文作为主要语言
- 消息应清晰、简洁
- 避免暴露敏感信息（如数据库错误详情）
- 提供可操作的建议

### 3. 安全考虑

**❌ 不要这样做:**
```json
{
  "error": "SQL Error: table 'users' doesn't exist",
  "code": "DATABASE_ERROR"
}
```

**✅ 应该这样做:**
```json
{
  "error": "Internal server error",
  "code": "INTERNAL_SERVER_ERROR"
}
```

### 4. 详情字段使用

`details` 字段应该只包含客户端需要的信息：

```json
{
  "success": false,
  "error": "Invalid input data",
  "code": "INVALID_INPUT",
  "details": {
    "fields": [
      {
        "field": "email",
        "reason": "must be a valid email address"
      },
      {
        "field": "password",
        "reason": "must be at least 8 characters"
      }
    ]
  }
}
```

## 向后兼容性

当添加新的错误码时：

1. ✅ **可以做**: 添加新的错误码
2. ✅ **可以做**: 为现有错误码添加新的 `details` 字段
3. ❌ **不要做**: 更改现有错误码的含义
4. ❌ **不要做**: 删除已使用的错误码

## 版本控制

- 错误码定义在 `pkg/errors/errors.go` 中
- 错误消息映射在 `pkg/errors/messages.go` 中
- 每次更新错误码都应更新本文档

## 参考

- [HTTP 状态码 RFC 7231](https://tools.ietf.org/html/rfc7231)
- [Problem Details for HTTP APIs RFC 7807](https://tools.ietf.org/html/rfc7807)
- [Google API Design Guide - Errors](https://cloud.google.com/apis/design/errors)

---

**最后更新**: 2026-06-14  
**维护者**: TZBlog Backend Team
