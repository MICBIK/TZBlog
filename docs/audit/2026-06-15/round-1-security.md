# 第 1 轮：安全审计报告

**审计时间**: 2026-06-15
**审计范围**: 认证 / 授权 / 注入 / XSS / CSRF / CORS / 限流 / 密钥 / 文件上传
**审计性质**: 只读审计，独立复核当前 HEAD（`44c3199`）真实状态，不盲信旧自评

---

## 📊 本轮摘要

| 维度 | 结论 |
|------|------|
| 认证（JWT） | ✅ 良好（算法校验、密钥强度、黑名单均已实现并接入） |
| 授权（RBAC） | ✅ 良好（AdminOnly 中间件 + 前端 AdminGuard 双层） |
| CSRF 防护 | 🔴 **BLOCKER：双重失效**（实现 bug + 前后端契约断裂） |
| XSS | ✅ 良好（后端 bluemonday 强制清洗 + 前端 react-markdown 默认安全） |
| SQL 注入 | ✅ 良好（全参数化，拼接仅用于占位符） |
| 限流 | 🟠 HIGH：登录限流代码存在但**未挂载**到路由 |
| 用户枚举 | 🟠 HIGH：注册/登录返回区分性错误 |
| 文件上传 | 🟠 HIGH：仅扩展名校验 + 整文件读入内存 |
| 密钥/配置 | ✅ 良好（启动强制校验 JWT/DB/Redis 密码强度） |

**本轮发现问题**: 1 BLOCKER + 4 HIGH + 4 MEDIUM

---

## 🔴 BLOCKER

### SEC-1-01：CSRF 防护双重失效（实际完全不生效）

**位置**: `backend/internal/api/middleware/csrf.go:83-124`（`OptionalCSRF`）+ `backend/cmd/server/main.go:198`

**漏洞 1 — 中间件顺序导致 CSRF 永远被跳过**

main.go 在路由组 `v1` 上注册了 `OptionalCSRF()`：
```go
v1 := router.Group("/api/v1")
v1.Use(middleware.OptionalCSRF())   // ← 在 v1 层
```
而鉴权中间件是在更内层的子路由组上注册的：
```go
articlesProtected := articles.Group("")
articlesProtected.Use(middleware.AuthMiddleware(...))  // ← 在子组层
```

Gin 中间件**按注册顺序从外到内执行**。`OptionalCSRF` 运行时，`AuthMiddleware` 还没执行，`c.Get("user_id")` 必然不存在：

```go
// OptionalCSRF 内部：
_, authenticated := c.Get("user_id")   // 此时 AuthMiddleware 还没跑，永远为 false
if !authenticated {
    c.Next()                            // ← 所有写请求都从这里跳过 CSRF
    return
}
```

**结果**：所有 POST/PUT/PATCH/DELETE 请求都绕过了 CSRF 校验。CSRF 防护**形同虚设**。

**漏洞 2 — CSRF cookie 设了 `httpOnly: true`，前端无法读取**

```go
// csrf.go:67-75 SetCSRFToken
c.SetCookie(
    "csrf_token", ..., 
    true,   // httpOnly = true  ← JS 读不到
)
```

Double Submit Cookie 模式要求：JS 能读取 cookie 值并放入 `X-CSRF-Token` 请求头。`httpOnly=true` 使得前端 JS 永远拿不到 token，也就**永远无法构造合法的写请求**——这意味着即便漏洞 1 被修复，所有写操作会立即 403。

**漏洞 3 — 前端完全没有 CSRF 逻辑**

前端审计确认：`frontend/app`、`frontend/components`、`frontend/lib`、`frontend/types` 中**没有任何** `csrf`/`xsrf`/`X-CSRF-Token` 相关代码。`lib/api/client.ts` 的 axios 拦截器只注入 `Authorization`，不发 CSRF token。

**综合结论**：当前 CSRF 防护链路是「后端实现有 bug + cookie 配置错误 + 前端完全不接入」三重断裂。
- 对**安全性**而言：漏洞 1 + 3 叠加 = CSRF 完全不生效，攻击者可构造跨站写请求。
- 对**功能性**而言：漏洞 1 一旦被修复（按原意），漏洞 2 + 3 会让所有写操作 403，系统不可用。

**修复建议**（三处需同时改）：
1. 把 `OptionalCSRF` 移到 `AuthMiddleware` **之后**执行（或合并进受保护路由组），确保 `user_id` 已设置。
2. CSRF cookie 改为 `httpOnly: false`（Double Submit 模式的固有要求），或改用 **Synchronizer Token**（token 存服务端 session，前端通过专门接口取）。
3. 前端：axios 请求拦截器读取 `csrf_token` cookie 并写入 `X-CSRF-Token` 头；登录后调用一个 `GET /csrf-token` 端点获取并存储 token。
4. 进一步：既然 JWT 存在 localStorage（非 cookie），**后端不使用 cookie 做认证**，理论上免疫经典 CSRF。可考虑直接移除 CSRF 中间件，在文档中说明「因使用 Bearer Token 而非 cookie，天然防 CSRF」——这是更干净的方案，但需确认未来不会引入 cookie 认证。

---

## 🟠 HIGH

### SEC-1-02：登录限流代码存在但未挂载到路由（暴力破解风险）

**位置**: `backend/internal/api/middleware/login_ratelimit.go`（`LoginRateLimit`/`SimpleLoginRateLimit`）vs `backend/cmd/server/main.go:203`

main.go 注册登录路由：
```go
auth.POST("/login", authHandler.Login)   // ← 没有 LoginRateLimit()
```

`LoginRateLimit`（5 次/分钟/邮箱+IP）和 `SimpleLoginRateLimit`（5 次/分钟/IP）都已实现，但**从未在路由中使用**（grep 确认无调用点）。当前保护登录的只有全局 `IPRateLimiter(100, 200)`（100 req/s），完全挡不住密码暴力破解。

**修复**: `auth.POST("/login", middleware.SimpleLoginRateLimit(), authHandler.Login)`，或用更严格的 `LoginRateLimit`（按邮箱+IP）。

---

### SEC-1-03：用户枚举漏洞（注册/登录返回可区分错误）

**位置**: `backend/internal/service/auth_service.go:39-50`（Register）、`:96-111`（Login）

```go
// Register：明确告诉调用方"用户名已存在"/"邮箱已存在"
if existingUser != nil { return nil, user.ErrUsernameExists }
...
if existingUser != nil { return nil, user.ErrEmailExists }

// Login：区分了 ErrAccountBanned / ErrAccountInactive
if usr.Status == user.StatusBanned { return nil, user.ErrAccountBanned }
```

攻击者可：
- 通过注册接口枚举哪些用户名/邮箱已注册。
- 通过登录响应区分"账号不存在"、"账号被封禁"、"密码错误"。

**修复**: 注册流程统一返回"若该凭据可用则创建成功"，或对注册失败采用恒定响应；登录失败统一返回 `ErrInvalidCredentials`（不暴露 banned/inactive 细节，或要求通过邮件验证流程处理）。

---

### SEC-1-04：文件上传仅校验扩展名 + 整文件读入内存

**位置**: `backend/pkg/storage/r2.go:63-111`、`backend/internal/api/handlers/storage_handler.go`

```go
// r2.go:83 仅按扩展名推断 contentType
switch strings.ToLower(ext) {
case ".jpg", ".jpeg": contentType = "image/jpeg"
...
}

// r2.go:76 整个文件读入内存
fileContent, err := io.ReadAll(fileReader)
```

问题：
1. **仅扩展名校验**：攻击者可上传伪装成 `.png` 的恶意文件（如含恶意脚本的 SVG、HTML 重命名）。旧报告 SEC-008 指出，**未修复**。
2. **整文件读入内存**：虽有 5MB 大小限制（handler 层 `validateImageFile`），但 `io.ReadAll` 对并发上传仍会消耗 `并发数 × 5MB` 内存。
3. **未校验真实 MIME**：未用 `http.DetectContentType` 读取文件魔数校验。

**修复**:
```go
// 读取前 512 字节检测真实 MIME
buf := make([]byte, 512)
n, _ := fileReader.Read(buf)
detected := http.DetectContentType(buf[:n])
if !strings.HasPrefix(detected, "image/") {
    return "", fmt.Errorf("not a valid image")
}
// 用 io.MultiReader 拼接已读部分和剩余，避免整文件入内存
```

---

### SEC-1-05：修改密码后未使旧 Token 失效

**位置**: `backend/internal/service/auth_service.go:187-226`（ChangePassword）

`ChangePassword` 更新了密码哈希、记录了密码历史，但**没有将当前用户的现有 token 加入黑名单**。SEC-002（Token 撤销）在登出场景已修复（`tokenBlacklist`），但**改密场景遗漏**：

攻击场景：攻击者窃取了 token → 用户发现异常修改密码 → 攻击者的旧 token 在过期前仍有效。

`AuthMiddleware` 已有 `tokenBlacklist.IsRevoked(claims.JTI)` 检查能力，只需在 `ChangePassword` 里把当前 jti（或该用户所有未过期 token）加入黑名单。

**修复**: `ChangePassword` 接收当前请求的 `jti`，调用 `tokenBlacklist.Revoke(jti, expiry)`；或引入 `token_version` 机制（用户表加字段，改密时递增，JWT claims 带版本号，中间件比对）。

---

## 🟡 MEDIUM

### SEC-1-06：全局 IP 限流器 cleanup 间隔过长（1 小时）

**位置**: `backend/internal/api/middleware/ratelimit.go:57-66`

cleanup 每 1 小时跑一次，删除"超过 1 小时未访问"的 IP。在 1 小时窗口内，攻击者用大量伪造 IP（如经代理池）灌注请求，`limiters` map 可无限增长（每个唯一 IP 一个 entry），造成**内存放大**。

**修复**: 缩短 cleanup 间隔到 5-10 分钟，或改用带容量上限的 LRU（如 `hashicorp/golang-lru`）。

### SEC-1-07：异步 `UpdateLastLogin` 无超时/无错误处理

**位置**: `backend/internal/service/auth_service.go:114-116`

```go
go func() {
    _ = s.userRepo.UpdateLastLogin(usr.ID)   // 无 context 超时，错误被吞
}()
```

高并发登录时，这些 goroutine 无限堆积且无超时；DB 故障时 goroutine 阻塞泄漏。旧报告 CONC-001 类问题在此复现。

**修复**: 传入带超时的 context（`context.WithTimeout(ctx, 3*time.Second)`），或用 worker 队列异步消费。

### SEC-1-08：生产 CORS 白名单是占位符

**位置**: `backend/cmd/server/main.go:183`

```go
allowedOrigins := []string{"https://yourdomain.com"} // Configure this
```

若部署时忘记改，生产环境只有 `yourdomain.com` 能访问 API（功能故障），或开发者图方便回退到 `DevelopmentCORS`（`*` + credentials，致命）。应从配置/环境变量读取，启动时校验非占位符。

### SEC-1-09：`LoginRateLimit` 的 email 提取方式脆弱

**位置**: `backend/internal/api/middleware/login_ratelimit.go:46-69`

中间件先 `io.ReadAll` 整个 body，再 `ShouldBindJSON`（会消费 body），失败时再 restore。这套 restore 逻辑依赖 `bodyBytes` 的多次 NopCloser 包装，一旦后续中间件/handler 改变 body 读取行为就会断链。且若 body 不是合法 JSON（`ShouldBindJSON` 失败），限流 key 的 email 为空，**攻击者可发畸形 body 绕过基于 email 的限流**。

---

## ✅ 安全方面的亮点（已正确实现）

为客观起见，记录已正确实现的安全措施（与旧报告的自评一致）：

| 项 | 实现位置 | 评价 |
|----|---------|------|
| JWT 算法混淆防护 | `pkg/auth/jwt.go:69` 强制 `SigningMethodHMAC` | ✅ 正确 |
| JWT 密钥强度校验 | `config/config.go:38` Load 时调用 `ValidateJWTSecret`（≥32 字符 + 弱密钥黑名单） | ✅ 正确接入启动流程 |
| JWT claims 含 jti + 黑名单 | `pkg/auth/jwt.go:40`、`cache/token_blacklist.go` | ✅ 登出撤销已生效 |
| 密码哈希 | `golang.org/x/crypto/bcrypt`（user domain） | ✅ |
| 密码历史防重用 | `auth_service.go:202-217`（可选，需注入 repo） | ✅ |
| XSS - 后端内容清洗 | `pkg/sanitizer/html.go` bluemonday；article/comment service 在写入前强制 `SanitizeContent()` | ✅ 双层（strict + UGC） |
| XSS - 前端 Markdown | `MarkdownContent.tsx` 用 `react-markdown`（默认不渲染原始 HTML），无 `rehype-raw`/`dangerouslySetInnerHTML` | ✅ 默认安全 |
| SQL 注入 | `batch_operations.go` 的 `fmt.Sprintf` 仅拼 `(?, ?)` 占位符，值走 `args...` 参数化 | ✅ 安全 |
| CORS 白名单实现 | `middleware/cors.go` 生产模式按 origin 精确匹配 | ✅（仅占位符问题见 SEC-1-08） |
| Admin 授权 | 后端 `AdminOnly` 中间件（真正的安全防线）+ 前端 `AdminGuard`（UX 层） | ✅ 纵深防御 |
| 文件大小限制 | `storage_handler.go` 5MB | ✅（但见 SEC-1-04） |
| 请求超时/优雅关闭 | main.go `ReadTimeout`/`WriteTimeout`/`Shutdown` | ✅ |

---

## 本轮结论

后端在**认证、XSS、SQL 注入、密钥管理**这四大传统高危领域做得扎实（旧报告这些项的修复属实）。但存在 **1 个 BLOCKER 级 CSRF 双重失效**（既有实现 bug 又有前后端契约断裂），以及**登录无限流、用户枚举、改密不撤销 token、文件上传仅查扩展名** 4 个 HIGH 级真实漏洞——这些在旧报告中被标为"已修复"，但复核发现**部分未真正接入或遗漏场景**。

最大风险点：**CSRF 防护看似完善（有中间件、有测试、有"SEC-006 FIX"注释），实则完全失效**——典型的"安全剧场"。建议优先级最高处理。
