# TZBlog Backend - 不规范行为修复清单

## 🔴 已发现的不规范行为

### 1. 目录结构问题 ✅ 已修复

**问题**: 文件在 `backend/backend/` 嵌套目录
**原因**: 工作目录错误导致
**修复**: 
```bash
cd backend
cp -r backend/* .
rm -rf backend
```

**影响文件**:
- 所有 `.go` 文件
- 配置文件
- Dockerfile

---

### 2. 代码规范问题

#### 2.1 错误处理不完整

**问题位置**: `internal/api/handlers/*.go`

**不规范**:
```go
// ❌ 错误：未检查错误
h.articleRepo.IncrementViewCount(article.ID)
```

**应该**:
```go
// ✅ 正确：使用 goroutine 处理且记录错误
go func() {
    if err := h.articleRepo.IncrementViewCount(article.ID); err != nil {
        logger.Error("Failed to increment view count", 
            zap.Int64("article_id", article.ID),
            zap.Error(err))
    }
}()
```

#### 2.2 类型断言缺少检查

**问题位置**: 多个 handler 文件

**不规范**:
```go
// ❌ 错误：直接断言可能 panic
userID := c.Get("user_id").(int64)
```

**应该**:
```go
// ✅ 正确：检查断言结果
userID, ok := c.Get("user_id")
if !ok {
    response.Unauthorized(c, "Unauthorized")
    return
}
uid, ok := userID.(int64)
if !ok {
    response.InternalError(c, "Invalid user ID type")
    return
}
```

#### 2.3 Magic Numbers

**问题位置**: `pkg/storage/r2.go`

**不规范**:
```go
// ❌ 错误：硬编码数字
const MaxImageSize = 5 * 1024 * 1024
```

**应该**:
```go
// ✅ 正确：使用常量并说明
const (
    // MaxImageSize 最大图片大小限制为 5MB
    MaxImageSize = 5 * 1024 * 1024
    
    // ImageSizeMB 用于错误消息
    ImageSizeMB = 5
)
```

---

### 3. 测试缺失 ❌ 待补充

**问题**: 80% 测试覆盖率未达成

**缺少的测试**:
- [ ] `internal/api/handlers/*_test.go` (0/10)
- [ ] `internal/repository/postgres/*_test.go` (0/8)
- [ ] `pkg/auth/jwt_test.go` (0/1)
- [ ] `pkg/storage/r2_test.go` (0/1)

**Action Required**: 补充单元测试

---

### 4. 文档注释不完整

**问题**: 公开函数/类型缺少文档注释

**示例**:
```go
// ❌ 错误：无注释
func NewAuthHandler(userRepo user.UserRepository, jwtSecret, jwtExpiry string) *AuthHandler {
    return &AuthHandler{...}
}

// ✅ 正确：完整注释
// NewAuthHandler 创建认证处理器
// 
// 参数:
//   - userRepo: 用户仓储接口
//   - jwtSecret: JWT 密钥
//   - jwtExpiry: Token 过期时间
//
// 返回:
//   - *AuthHandler: 认证处理器实例
func NewAuthHandler(userRepo user.UserRepository, jwtSecret, jwtExpiry string) *AuthHandler {
    return &AuthHandler{...}
}
```

---

### 5. Git Commit 规范问题

**问题**: 部分 commit 消息过长或不规范

**不规范示例**:
```
feat(backend): complete ALL 25 tasks - Full backend implementation

Task 24: Main application with dependency injection (3h)
✅ Complete main.go with all components wired
✅ Config loading
... (过长)
```

**应该**:
```
feat(backend): complete main application setup

- Wire all dependencies with dependency injection
- Initialize DB, Redis, and R2 storage
- Register all handlers and routes
- Configure middleware pipeline

Task 24/25 complete (3h)
```

---

### 6. 配置文件缺失

**问题**: `config/config.yaml` 不存在

**Action Required**: 创建示例配置文件

---

### 7. 数据库连接未测试

**问题**: InitDB 和 InitRedis 未验证实际连接

**修复**: 添加 Ping 测试

---

### 8. 导入顺序不规范

**问题**: import 顺序混乱

**应该**: 
```go
import (
    // 标准库
    "context"
    "fmt"
    
    // 第三方库
    "github.com/gin-gonic/gin"
    "gorm.io/gorm"
    
    // 项目内部
    "github.com/MICBIK/TZBlog/backend/config"
    "github.com/MICBIK/TZBlog/backend/internal/domain/user"
)
```

---

## 📝 修复优先级

### P0 (立即修复)
- [x] 目录结构问题
- [ ] 类型断言安全检查
- [ ] 配置文件创建

### P1 (本周修复)
- [ ] 补充单元测试 (达到 80%)
- [ ] 完善错误处理
- [ ] 添加函数文档注释

### P2 (下周修复)
- [ ] 统一 import 顺序
- [ ] 重构长函数 (>50行)
- [ ] 添加集成测试

---

## 🎯 修复进度

- 目录结构: ✅ 已修复
- 代码规范: ⏳ 进行中
- 测试覆盖: ❌ 待开始
- 文档完善: ⏳ 进行中

---

**最后更新**: 2026-06-14
