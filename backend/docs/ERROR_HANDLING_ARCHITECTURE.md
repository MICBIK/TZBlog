# 统一错误处理架构

## 概述

本文档描述了 TZBlog 后端的统一错误处理架构，解决了 Phase 3 审计中发现的 C-007 和 C-016 问题。

## 架构层次

### 1. Domain 层（领域层）

**位置**: `internal/domain/{domain_name}/errors.go`

**职责**: 定义业务领域特定的错误

**示例**:
```go
// internal/domain/article/errors.go
package article

import "github.com/MICBIK/TZBlog/backend/pkg/errors"

var (
    ErrArticleNotFound = &errors.AppError{
        Code:    "ARTICLE_NOT_FOUND",
        Message: "Article not found",
    }
    
    ErrInvalidTitle = &errors.AppError{
        Code:    "INVALID_TITLE",
        Message: "Article title is required",
    }
)
```

**已实现的 Domain 错误**:
- ✅ `internal/domain/article/errors.go` - 文章相关错误
- ✅ `internal/domain/user/errors.go` - 用户相关错误
- ✅ `internal/domain/comment/errors.go` - 评论相关错误
- ✅ `internal/domain/category/errors.go` - 分类相关错误
- ✅ `internal/domain/tag/errors.go` - 标签相关错误
- ✅ `internal/domain/subscription/errors.go` - 订阅相关错误
- ✅ `internal/domain/payment/errors.go` - 支付相关错误
- ✅ `internal/domain/like/errors.go` - 点赞相关错误
- ✅ `internal/domain/follow/errors.go` - 关注相关错误
- ✅ `internal/domain/view/errors.go` - 浏览相关错误
- ✅ `internal/domain/progress/errors.go` - 进度相关错误
- ✅ `internal/domain/apikey/errors.go` - API Key 相关错误

### 2. Service 层（服务层）

**位置**: `internal/service/{service_name}_service.go`

**职责**: 包装数据库错误和基础设施错误为 Domain 错误

**模式**:
```go
func (s *ArticleService) GetArticleByID(id int64) (*article.Article, error) {
    art, err := s.repo.FindByID(id)
    if err != nil {
        // 识别特定错误并返回对应的 domain 错误
        if errors.Is(err, gorm.ErrRecordNotFound) {
            return nil, article.ErrArticleNotFound
        }
        // 包装其他未知错误
        return nil, errors.Wrap(err, "DATABASE_ERROR", "Failed to get article")
    }
    
    if art == nil {
        return nil, article.ErrArticleNotFound
    }
    
    return art, nil
}
```

### 3. API/Response 层（响应层）

**位置**: `internal/api/response/response.go`

**职责**: 将 AppError 转换为 HTTP 响应

**核心函数**:
```go
// HandleError 统一错误处理入口
func HandleError(c *gin.Context, err error) {
    var appErr *apperrors.AppError
    if errors.As(err, &appErr) {
        c.JSON(getStatusCode(appErr.Code), Response{
            Success: false,
            Error: &Error{
                Code:    appErr.Code,
                Message: appErr.Message,
                Details: appErr.Details,
            },
        })
        return
    }
    
    // 未知错误返回 500
    c.JSON(http.StatusInternalServerError, Response{
        Success: false,
        Error: &Error{
            Code:    "INTERNAL_SERVER_ERROR",
            Message: "Internal server error",
        },
    })
}
```

**HTTP 状态码映射**:
- `400 Bad Request` - 验证错误（INVALID_*, *_TOO_LONG 等）
- `401 Unauthorized` - 认证错误（UNAUTHORIZED, INVALID_TOKEN 等）
- `403 Forbidden` - 权限错误（FORBIDDEN）
- `404 Not Found` - 资源不存在（*_NOT_FOUND）
- `409 Conflict` - 资源冲突（*_EXISTS, ALREADY_*）
- `410 Gone` - 资源已删除（*_DELETED, *_REVOKED）
- `422 Unprocessable Entity` - 业务逻辑错误（*_EXPIRED, *_REUSED）
- `429 Too Many Requests` - 限流错误（TOO_MANY_REQUESTS, RATE_LIMIT_EXCEEDED）
- `500 Internal Server Error` - 服务器错误（INTERNAL_SERVER_ERROR, *_FAILED）

### 4. Handler 层（处理器层）

**位置**: `internal/api/handlers/{handler_name}_handler.go`

**职责**: 调用 Service 并使用统一错误处理

**模式**:
```go
func (h *ArticleHandler) GetArticle(c *gin.Context) {
    id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
    
    art, err := h.service.GetArticleByID(id)
    if err != nil {
        // 统一错误处理
        response.HandleError(c, err)
        return
    }
    
    response.Success(c, art)
}
```

## AppError 结构

**位置**: `pkg/errors/errors.go`

```go
type AppError struct {
    Code    string `json:"code"`           // 错误代码（用于映射 HTTP 状态码和 i18n）
    Message string `json:"message"`        // 错误消息（用户可读）
    Details any    `json:"details,omitempty"` // 额外详情
    Cause   error  `json:"-"`              // 底层错误（不序列化）
}
```

**特性**:
- 实现了 `error` 接口
- 支持错误包装（Unwrap）
- 支持链式添加 Details 和 Cause
- JSON 序列化安全（Cause 不会泄露）

## 迁移清单

### ✅ 已完成

1. **Domain 层错误定义**
   - 所有 domain 包都有独立的 `errors.go`
   - 使用 `AppError` 定义所有业务错误
   - 移除了旧的 `errors.New()` 定义

2. **删除重复的 Response 包**
   - 删除了 `pkg/response/`
   - 统一使用 `internal/api/response/`
   - 更新了所有 handler 的 import

3. **Response 层错误映射**
   - 更新了 `getStatusCode()` 函数
   - 包含所有新增的错误代码
   - 正确映射到 HTTP 状态码

### 🔄 待完成（需要逐个 Service 更新）

1. **Service 层错误包装**
   - [ ] `internal/service/article_service.go`
   - [ ] `internal/service/auth_service.go`
   - [ ] `internal/service/comment_service.go`
   - [ ] 其他 service 文件

## 错误处理最佳实践

### ✅ 正确做法

1. **Domain 层返回预定义错误**
   ```go
   if a.Title == "" {
       return article.ErrInvalidTitle
   }
   ```

2. **Service 层包装基础设施错误**
   ```go
   if errors.Is(err, gorm.ErrRecordNotFound) {
       return nil, article.ErrArticleNotFound
   }
   ```

3. **Handler 层使用统一错误处理**
   ```go
   if err != nil {
       response.HandleError(c, err)
       return
   }
   ```

### ❌ 错误做法

1. **直接在 Handler 中返回字符串错误**
   ```go
   // 错误
   response.BadRequest(c, "Article not found")
   
   // 正确
   response.HandleError(c, article.ErrArticleNotFound)
   ```

2. **Service 层直接返回 gorm 错误**
   ```go
   // 错误
   return s.repo.FindByID(id)
   
   // 正确
   art, err := s.repo.FindByID(id)
   if err != nil {
       if errors.Is(err, gorm.ErrRecordNotFound) {
           return nil, article.ErrArticleNotFound
       }
       return nil, errors.Wrap(err, "DATABASE_ERROR", "Failed to get article")
   }
   ```

3. **创建一次性错误而不是使用预定义错误**
   ```go
   // 错误
   return errors.New("ARTICLE_NOT_FOUND", "Article not found")
   
   // 正确
   return article.ErrArticleNotFound
   ```

## API 响应格式

### 成功响应
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Example Article"
  }
}
```

### 错误响应
```json
{
  "success": false,
  "error": {
    "code": "ARTICLE_NOT_FOUND",
    "message": "Article not found"
  }
}
```

### 带详情的错误响应
```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "Validation failed",
    "details": {
      "fields": {
        "title": "Title is required",
        "content": "Content is too long"
      }
    }
  }
}
```

## 验证

所有核心错误处理包编译成功：
```bash
✅ pkg/errors
✅ internal/api/response
✅ internal/domain/article
✅ internal/domain/user
✅ internal/domain/comment
✅ internal/domain/category
✅ internal/domain/tag
✅ internal/domain/subscription
✅ internal/domain/payment
✅ internal/domain/like
✅ internal/domain/follow
✅ internal/domain/view
✅ internal/domain/progress
✅ internal/domain/apikey
```

## 下一步

1. 更新所有 Service 层方法以正确包装错误
2. 确保所有 Handler 使用 `response.HandleError`
3. 添加集成测试验证错误处理流程
4. 考虑添加 i18n 支持（多语言错误消息）

## 相关问题

- **C-007**: 错误代码不一致 - ✅ 已解决（统一使用 AppError）
- **C-016**: Response 定义重复 - ✅ 已解决（删除 pkg/response）

---

**最后更新**: 2026-06-14
**作者**: 错误处理专家
**状态**: 架构完成，等待 Service 层迁移
