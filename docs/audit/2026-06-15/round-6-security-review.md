# 第 6 轮（第二轮审计）：安全复审报告

**审计时间**: 2026-06-15（第二轮）
**审计基线 HEAD**: `42aa129 docs: 添加最终完成报告`
**对照**: 第一轮报告 round-1-security.md 的 9 个问题
**审计目的**: 验证修复是否真生效 + 发现修复引入的新问题

---

## 📊 本轮摘要

| 第一轮问题 | 修复状态 | 验证结论 |
|-----------|---------|---------|
| SEC-1-01 CSRF 双重失效 | 🔴 **回归性 BLOCKER** | 挂载位置修了，但 token 从不下发 + 前端不接入 → **所有写操作 403** |
| SEC-1-02 登录无限流 | ✅ 已修复 | `SimpleLoginRateLimit()` 已挂 `/auth/login` |
| SEC-1-03 用户枚举 | ✅ 已修复 | Register/Login 统一返回 `ErrInvalidCredentials` |
| SEC-1-04 文件上传仅查扩展名 | ✅ 已修复 | `http.DetectContentType` 检测真实 MIME |
| SEC-1-05 改密不撤销 token | ✅ 已修复 | `ChangePassword` 调 `Revoke(jti, 24h)` + main.go 注入 blacklist |
| SEC-1-06 限流 cleanup 间隔 | ❓ 未验证（低优） | — |
| SEC-1-07 异步无超时 | ❓ 未验证（低优） | — |
| SEC-1-08 CORS 占位符 | ❌ **未修** | `yourdomain.com` 仍在 |
| SEC-1-09 LoginRateLimit email 提取 | ➡️ 已绕过（改用 SimpleLoginRateLimit 按 IP） | — |

**本轮新发现问题**: 1 回归性 BLOCKER + 2 新问题

---

## 🔴 回归性 BLOCKER（修复反而破坏了功能）

### SEC-6-01：CSRF 修复是半成品 —— 所有已认证写操作现在都会 403

**这是本轮最严重的发现：第一轮的 CSRF "修复"让情况从"静默失效"变成了"主动阻断所有写操作"。**

#### 第一轮问题回顾
原问题三重断裂：①中间件顺序错（永远跳过）②cookie httpOnly（JS 读不到）③前端不接入。

#### 本次修复做了什么
- ✅ 把 `OptionalCSRF` 挂载位置从 v1 组改到各 `xxxProtected` 子组（`AuthMiddleware` 之后）——顺序问题修了，CSRF 现在会**真正执行校验**。
- ✅ 登录限流挂载了。
- ❌ **但 `SetCSRFToken`（下发 token 的函数）从未被任何路由/处理器调用**（grep 全后端，只有定义，零调用点）。
- ❌ **`SetCSRFToken` 第 74 行 `httpOnly: true` 仍未改**（Double Submit 模式要求 JS 可读）。
- ❌ **前端仍完全没有 CSRF 逻辑**（grep 前端全空）。

#### 后果（实测推理）
现在任何已认证用户执行写操作（发评论、点赞、上传、改文章、改资料）：
1. `OptionalCSRF` 检查 → method 是 POST/PUT/DELETE → 继续
2. `c.Get("user_id")` 存在（已认证）→ 继续
3. `c.Cookie("csrf_token")` → **cookie 从未被 SetCSRFToken 设置过** → `err != nil`
4. 返回 `403 CSRF token missing in cookie` → **写操作 100% 失败**

**结论**：修复者把 CSRF 中间件"接通"了，但忘了补 token 下发链路和前端接入。这等于把一个"装睡的保安"换成了"没给钥匙的保安"——现在保安真的拦人了，但没人能通过。

**这比第一轮更糟**：第一轮是"CSRF 不生效但功能正常"（安全隐患），现在是"CSRF 生效但功能全断"（功能故障 + 仍不安全，因为前端根本发不出合法请求，真实用户和攻击者一样被拦）。

#### 修复建议（三选一，推荐方案 A）

**方案 A（推荐，最干净）：移除 CSRF 中间件，依赖 Bearer Token 天然免疫**
本项目用 `Authorization: Bearer <jwt>` 做认证，token 存 localStorage（非 cookie）。经典 CSRF 攻击依赖浏览器自动携带 cookie，而 Bearer Token 不会自动携带——**因此本项目天然免疫 CSRF**。CSRF 中间件是多余的，且它的存在反而制造了功能故障。
```go
// 删除所有 OptionalCSRF() 挂载，删除 csrf.go
// 在 API 文档注明：因使用 Bearer Token 而非 cookie 认证，天然防 CSRF
```

**方案 B（完整实现 Double Submit）**：
1. 新增 `GET /api/v1/auth/csrf-token` 端点，调用 `SetCSRFToken`。
2. `SetCSRFToken` 的 `httpOnly` 改为 `false`。
3. 前端：登录后调 `/csrf-token`，axios 拦截器读 cookie 放 `X-CSRF-Token` header。

**方案 C（Synchronizer Token）**：token 存 Redis session，前端通过专用端点获取。最安全但改造量大。

---

## 🟠 新发现的问题

### SEC-6-02：main.go 的类型断言写法极其不 idiomatic（代码异味 + 维护陷阱）

**位置**: `backend/cmd/server/main.go:148-156`

```go
authService := service.NewAuthService(userRepo, jwtAuth)
if authSvc, ok := authService.(interface {
    SetTokenBlacklist(interface {
        Revoke(tokenID string, expiry time.Duration) error
        IsRevoked(tokenID string) bool
    })
}); ok {
    authSvc.SetTokenBlacklist(tokenBlacklist)
}
```

问题：
1. **冗余的匿名 interface 断言**：`NewAuthService` 返回的是 `*AuthService` 具体类型（或明确接口），完全不需要用匿名 interface 做鸭子类型断言。
2. **嵌套匿名 interface 作为参数类型**：参数又定义了一个匿名 interface（`Revoke/IsRevoked`），与 `cache.TokenBlacklist` 实际类型脱钩。虽然能跑（结构化匹配），但：
   - 若未来 `TokenBlacklist` 接口加方法，这里不会编译报错（静默不匹配 → 断言失败 → blacklist 不注入 → SEC-1-05 静默失效）。
   - 可读性极差。
3. 这是"为了让代码编译通过而硬塞"的典型痕迹。

**修复**：
```go
// 方式1：构造函数直接接收
authService := service.NewAuthService(userRepo, jwtAuth, tokenBlacklist)

// 方式2：干净的类型断言
if authSvc, ok := authService.(*service.AuthService); ok {
    authSvc.SetTokenBlacklist(tokenBlacklist)
}
```

---

### SEC-6-03：CORS 生产白名单仍是占位符（SEC-1-08 未修）

**位置**: `backend/cmd/server/main.go:194`
```go
allowedOrigins := []string{"https://yourdomain.com"} // Configure this
```

与第一轮完全一致，未修复。部署时若忘记改，生产环境前端无法访问 API（CORS 拒绝），或开发者图方便回退到 DevelopmentCORS（`*` + credentials，致命）。

**修复**：从 `cfg` 读取，启动时校验非占位符。

---

## ✅ 真正修复确认（客观记录）

| 项 | 验证证据 |
|----|---------|
| SEC-1-02 登录限流 | `main.go:213` `auth.POST("/login", middleware.SimpleLoginRateLimit(), ...)` ✅ |
| SEC-1-03 用户枚举 | `auth_service.go:54/64` Register 对 username/email 重复统一返回 `ErrInvalidCredentials`；Login 同理 ✅ |
| SEC-1-04 文件上传 MIME | `r2.go:85` `http.DetectContentType(buf[:n])` + 非 image/ 拒绝 ✅ |
| SEC-1-05 改密撤销 | `auth_service.go:244` `tokenBlacklist.Revoke(jti, 24h)` + `main.go:155` 注入真实 Redis blacklist ✅ |

这 4 项是**货真价实的修复**，实现正确且接入完整。

---

## 本轮结论

安全审计的 5 个 HIGH 问题中，**4 个真正修复了**（限流、用户枚举、文件 MIME、改密撤销），质量不错。但**最关键的 CSRF（BLOCKER）修复是半成品**——修复者理解了"挂载位置错误"，却没理解"token 下发 + 前端接入"是同一闭环的两半。结果修复反而引入了**所有写操作 403 的回归性故障**。

**强烈建议采用方案 A（直接移除 CSRF 中间件）**：本项目用 Bearer Token 认证，天然免疫 CSRF，CSRF 中间件既多余又危险（当前状态会阻断所有写操作）。这是成本最低、最彻底的修复。

另外，main.go 的类型断言写法（SEC-6-02）暴露了修复者对 Go 接口机制的理解不够扎实，建议重构。
