# SEC-6 Security Fixes Summary

修复日期: 2026-06-15

## 修复问题清单

### 1. SEC-6-01 (BLOCKER): CSRF 中间件移除 ✅

**问题**: CSRF 中间件已挂载但 token 从不下发，导致所有写操作 403

**根本原因**: 
- 项目使用 Bearer Token 认证（JWT in Authorization header）
- Bearer Token 天然免疫 CSRF 攻击
- CSRF 中间件是多余的，且未完成集成会导致所有写操作失败

**修复内容**:
1. 删除文件: `internal/api/middleware/csrf.go`
2. 移除所有 `middleware.OptionalCSRF()` 调用（共 8 处）:
   - `/auth/*` 路由
   - `/articles/*` 路由
   - `/categories/*` 路由
   - `/tags/*` 路由
   - `/comments/*` 路由
   - `/likes/*` 路由
   - `/uploads/*` 路由
   - `/system/*` 路由
3. 创建文档: `docs/security/csrf-protection.md` 说明为什么不需要 CSRF 保护

**技术说明**:
- CSRF 攻击依赖浏览器自动发送 cookies
- Bearer Token 必须由 JavaScript 显式添加到请求头
- 跨域请求无法访问 localStorage/sessionStorage（同源策略）
- 恶意网站无法获取或发送 Bearer Token

**安全保障**:
- ✅ CORS 白名单控制允许的来源
- ✅ Rate limiting 防止暴力攻击
- ✅ Token 过期机制（7 天）
- ✅ Token 黑名单（登出、修改密码后撤销）
- ✅ 输入验证
- ✅ SQL 注入保护（GORM 参数化查询）
- ✅ XSS 保护（JSON 响应）

---

### 2. SEC-6-02: main.go 类型断言规范化 ✅

**问题**: 使用匿名接口进行类型断言，不符合 Go 最佳实践

**位置**: `cmd/server/main.go:148-156`

**修复前**:
```go
if authSvc, ok := authService.(interface {
    SetTokenBlacklist(interface {
        Revoke(tokenID string, expiry time.Duration) error
        IsRevoked(tokenID string) bool
    })
}); ok {
    authSvc.SetTokenBlacklist(tokenBlacklist)
}
```

**修复后**:
```go
// ✅ SEC-6-02: Use concrete type assertion instead of anonymous interface
if authSvc, ok := authService.(*service.AuthService); ok {
    authSvc.SetTokenBlacklist(tokenBlacklist)
}
```

**改进点**:
- 使用具体类型 `*service.AuthService` 而非匿名接口
- 代码更清晰、更易维护
- 编译器可以更好地检查类型安全

---

### 3. SEC-6-03: CORS 白名单配置验证 ✅

**问题**: CORS 白名单使用占位符 `"https://yourdomain.com"`，生产环境存在安全风险

**位置**: `cmd/server/main.go:194`

**修复内容**:

#### 3.1 添加配置字段

**文件**: `config/types.go`
```go
type ServerConfig struct {
    Port        string `yaml:"port"`
    Mode        string `yaml:"mode"`
    BaseURL     string `yaml:"base_url"`
    FrontendURL string `yaml:"frontend_url"` // 新增
}
```

#### 3.2 更新配置文件

**文件**: `config/config.yaml`
```yaml
server:
  port: "8080"
  mode: development
  base_url: "http://localhost:8080"
  frontend_url: "http://localhost:3000"  # 新增
```

#### 3.3 修复 main.go CORS 配置

**修复前**:
```go
} else {
    // Production: use whitelist CORS
    allowedOrigins := []string{"https://yourdomain.com"} // Configure this
    router.Use(middleware.CORS(allowedOrigins))
}
```

**修复后**:
```go
} else {
    // ✅ SEC-6-03: Production CORS whitelist from config
    allowedOrigins := []string{cfg.Server.FrontendURL}

    // Validate no placeholder origins
    for _, origin := range allowedOrigins {
        if origin == "" || origin == "https://yourdomain.com" || origin == "http://localhost:3000" {
            logger.Fatal("CORS allowedOrigins contains placeholder or default value, please configure server.frontend_url in config.yaml")
        }
    }

    router.Use(middleware.CORS(allowedOrigins))
    logger.Info("Production CORS configured", zap.Strings("allowed_origins", allowedOrigins))
}
```

**安全改进**:
- ✅ 从配置文件读取前端 URL
- ✅ 启动时验证不包含占位符或默认值
- ✅ 包含占位符时立即 Fatal，防止错误配置进入生产环境
- ✅ 记录配置的 CORS 来源日志

---

## 修改文件清单

### 删除文件
- `internal/api/middleware/csrf.go`

### 修改文件
1. `config/types.go` - 添加 `FrontendURL` 字段
2. `config/config.yaml` - 添加 `frontend_url` 配置
3. `cmd/server/main.go` - 移除所有 CSRF 中间件 + 修复类型断言 + 修复 CORS 配置

### 新增文件
- `docs/security/csrf-protection.md` - CSRF 保护策略说明

---

## 验证步骤

### 1. 编译验证
```bash
cd backend
go build ./cmd/server/
# ✅ 编译成功，无错误
```

### 2. 测试验证
```bash
go test ./...
# 需要用户权限执行
```

### 3. 配置验证
```bash
# 测试占位符检测（需要临时修改 config.yaml）
frontend_url: "https://yourdomain.com"
# 应该输出: FATAL - CORS allowedOrigins contains placeholder
```

---

## 安全等级评估

| 问题 | 修复前 | 修复后 |
|------|--------|--------|
| SEC-6-01 | BLOCKER - 所有写操作 403 | ✅ RESOLVED - Bearer Token 天然防 CSRF |
| SEC-6-02 | MEDIUM - 代码质量问题 | ✅ RESOLVED - 使用具体类型断言 |
| SEC-6-03 | HIGH - 生产环境 CORS 风险 | ✅ RESOLVED - 配置验证 + 启动检查 |

---

## 后续建议

### 1. 生产环境部署前
- [ ] 在 `config.yaml` 中配置正确的 `frontend_url`
- [ ] 确认 CORS 配置只允许信任的域名
- [ ] 测试所有写操作（POST/PUT/DELETE）正常工作

### 2. 文档更新
- [x] CSRF 保护策略文档已创建
- [ ] API 文档中说明使用 Bearer Token 认证
- [ ] 部署文档中添加 CORS 配置说明

### 3. 监控建议
- 监控 CORS 相关的 403 错误
- 记录来自非白名单域名的请求尝试
- 定期审计 Bearer Token 使用情况

---

## 审计人员签名

修复人: Claude (AI Assistant)
审核人: [待填写]
批准人: [待填写]

---

## 参考资料

- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [Why JWT tokens are immune to CSRF](https://security.stackexchange.com/questions/170388/do-i-need-csrf-token-if-im-using-bearer-jwt)
- [Go Type Assertions Best Practices](https://go.dev/tour/methods/15)
