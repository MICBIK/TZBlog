# 生产环境配置安全强化实施计划

**创建时间**: 2026-06-17  
**负责人**: Claude Code  
**预计工期**: 4-6 小时  
**优先级**: P0 (生产安全)

---

## 1. 背景与目标

### 1.1 当前问题

1. **缺少生产环境配置模板**
   - 仅有 `.env.example` 开发环境模板
   - 没有生产环境专用配置文件
   - 缺少强密码要求说明

2. **配置验证不完善**
   - JWT_SECRET 已有基本验证（≥32 字符）
   - DB_PASSWORD 已有基本验证
   - 但缺少全面的生产环境安全检查

3. **缺少密钥轮换文档**
   - 没有密钥生成指南
   - 没有密钥轮换流程
   - 没有应急响应预案

### 1.2 目标

1. **创建生产环境配置模板**
   - `.env.production.example` 带完整注释
   - 强密码要求说明
   - 密钥生成命令

2. **增强配置验证逻辑**
   - 生产环境强制 HTTPS
   - 数据库密码强度检查
   - Redis 密码强度检查
   - R2 配置完整性检查
   - 配置项环境感知验证

3. **添加配置验证入口**
   - 应用启动前执行验证
   - 弱配置拒绝启动并给出清晰错误
   - 开发环境警告，生产环境阻断

4. **完善安全文档**
   - 密钥生成指南
   - 密钥轮换流程
   - 应急响应预案
   - 安全配置检查清单

---

## 2. 技术方案

### 2.1 文件结构

```
backend/
├── .env.example                    # 开发环境（已存在）
├── .env.production.example         # 生产环境（新建）
├── config/
│   ├── config.go                   # 已有验证逻辑
│   ├── validation.go               # 新建：集中配置验证
│   ├── types.go                    # 已存在
│   └── config_test.go              # 补充验证测试
├── cmd/server/main.go              # 启动时调用验证
└── docs/
    └── security/
        ├── production-config.md    # 生产配置指南（新建）
        └── key-rotation.md         # 密钥轮换流程（新建）
```

### 2.2 配置验证策略

#### 验证层级

```
┌─────────────────────────────────────┐
│  应用启动前                          │
│  ├─ 读取配置                         │
│  ├─ 环境检测（IsDevelopment/IsProduction）│
│  └─ 调用 Validate()                  │
│      ├─ 基础验证（必填项）           │
│      ├─ 开发环境验证（宽松）          │
│      └─ 生产环境验证（严格）          │
│          ├─ HTTPS 强制               │
│          ├─ 密码强度                 │
│          ├─ 密钥长度                 │
│          └─ 敏感配置完整性           │
└─────────────────────────────────────┘
```

#### 验证规则

| 配置项 | 开发环境 | 生产环境 |
|--------|---------|---------|
| JWT_SECRET | ≥32 字符 | ≥32 字符 + 非默认值 + 高熵 |
| DB_PASSWORD | 任意 | ≥32 字符 + 非弱密码 + 高熵 |
| REDIS_PASSWORD | 可选 | 必填 + ≥16 字符 + 高熵 |
| SERVER_BASE_URL | http:// 允许 | https:// 强制 |
| R2 配置 | 可选 | 必填 + 完整性检查 |

### 2.3 密码强度检查

#### 弱密码黑名单

```go
var weakPasswords = []string{
    "password", "12345678", "admin", "root", "postgres",
    "tzblog", "changeme", "qwerty", "letmein", "welcome",
}
```

#### 熵计算

```go
func calculateEntropy(s string) float64 {
    // Shannon entropy: H = -Σ(p(x) * log2(p(x)))
    // 低熵: <3.0 (弱)
    // 中熵: 3.0-4.0 (中)
    // 高熵: >4.0 (强)
}
```

---

## 3. 实施步骤

### Phase 1: 创建配置验证模块（2 小时）

#### Step 1.1: 创建 `validation.go`

**新建文件**: `backend/config/validation.go`

**功能**:
- `Validate(cfg *Config) error` - 总入口
- `ValidateProduction(cfg *Config) error` - 生产环境验证
- `ValidateDevelopment(cfg *Config) error` - 开发环境验证
- `ValidatePasswordStrength(password string, minLength int, isProduction bool) error` - 密码强度
- `calculateEntropy(s string) float64` - 熵计算
- `isWeakPassword(password string) bool` - 弱密码检查
- `ValidateHTTPS(url string) error` - HTTPS 检查
- `ValidateR2Config(cfg *R2Config, isProduction bool) error` - R2 配置检查

**验证规则**:

```go
// 生产环境强制规则
if cfg.IsProduction() {
    // 1. HTTPS 强制
    if !strings.HasPrefix(cfg.Server.BaseURL, "https://") {
        return Error("生产环境必须使用 HTTPS")
    }
    
    // 2. JWT_SECRET 验证
    if len(cfg.JWT.Secret) < 32 {
        return Error("JWT_SECRET 至少 32 字符")
    }
    if calculateEntropy(cfg.JWT.Secret) < 4.0 {
        return Error("JWT_SECRET 熵过低，请使用更复杂的密钥")
    }
    
    // 3. DB_PASSWORD 验证
    if len(cfg.Database.Password) < 32 {
        return Error("生产环境数据库密码至少 32 字符")
    }
    if isWeakPassword(cfg.Database.Password) {
        return Error("数据库密码不能使用常见弱密码")
    }
    if calculateEntropy(cfg.Database.Password) < 3.5 {
        return Error("数据库密码熵过低")
    }
    
    // 4. REDIS_PASSWORD 验证
    if cfg.Redis.Password == "" {
        return Error("生产环境必须设置 Redis 密码")
    }
    if len(cfg.Redis.Password) < 16 {
        return Error("Redis 密码至少 16 字符")
    }
    
    // 5. R2 配置验证
    if cfg.Storage.R2.AccessKeyID == "" {
        return Error("生产环境必须配置 R2 AccessKeyID")
    }
    if cfg.Storage.R2.SecretAccessKey == "" {
        return Error("生产环境必须配置 R2 SecretAccessKey")
    }
}
```

#### Step 1.2: 修改 `config.go`

**修改**: `backend/config/config.go`

在 `Load()` 函数返回前添加：

```go
// Validate configuration based on environment
if err := Validate(&cfg); err != nil {
    return nil, fmt.Errorf("配置验证失败: %w", err)
}
```

移除现有的分散验证逻辑：
- `ValidateJWTSecret()` → 移到 `validation.go`
- `ValidateDatabasePassword()` → 移到 `validation.go`
- `ValidateRedisConfig()` → 移到 `validation.go`

#### Step 1.3: 补充单元测试

**修改**: `backend/config/config_test.go`

```go
func TestValidateProduction(t *testing.T) {
    tests := []struct {
        name    string
        config  *Config
        wantErr bool
        errMsg  string
    }{
        {
            name: "弱 JWT_SECRET",
            config: &Config{
                Server: ServerConfig{Mode: "production", BaseURL: "https://example.com"},
                JWT:    JWTConfig{Secret: "short"},
            },
            wantErr: true,
            errMsg:  "JWT_SECRET 至少 32 字符",
        },
        {
            name: "HTTP in production",
            config: &Config{
                Server: ServerConfig{Mode: "production", BaseURL: "http://example.com"},
            },
            wantErr: true,
            errMsg:  "生产环境必须使用 HTTPS",
        },
        // 更多测试用例...
    }
}
```

---

### Phase 2: 创建生产环境配置模板（1 小时）

#### Step 2.1: 创建 `.env.production.example`

**新建文件**: `backend/.env.production.example`

```bash
# ============================================
# TZBlog 生产环境配置模板
# ============================================
# ⚠️  警告: 这是生产环境配置模板
# ⚠️  所有密钥必须使用强随机值，不能使用示例值
# ============================================

# ============================================
# Server Configuration
# ============================================
SERVER_PORT=8080
SERVER_MODE=production
# ⚠️ 生产环境必须使用 HTTPS
SERVER_BASE_URL=https://api.yourdomain.com
FRONTEND_URL=https://yourdomain.com

# ============================================
# Database Configuration
# ============================================
DB_HOST=your-postgres-host
DB_PORT=5432
DB_USER=tzblog_prod
# ⚠️ CRITICAL: 生产环境数据库密码要求
# - 长度: ≥32 字符
# - 复杂度: 必须包含大小写字母、数字、特殊字符
# - 禁止: 不能包含 "password", "admin", "postgres", "tzblog" 等常见词
# - 熵: 必须达到高熵标准 (>3.5)
#
# 生成强密码命令:
# openssl rand -base64 32
# 或
# pwgen -s 40 1
DB_PASSWORD=CHANGE_ME_USE_openssl_rand_base64_32
DB_NAME=tzblog_production
# ⚠️ 生产环境必须启用 SSL
DB_SSLMODE=require

# ============================================
# Redis Configuration
# ============================================
REDIS_HOST=your-redis-host
REDIS_PORT=6379
# ⚠️ CRITICAL: 生产环境必须设置 Redis 密码
# - 长度: ≥16 字符
# - 生成命令: openssl rand -base64 24
REDIS_PASSWORD=CHANGE_ME_USE_openssl_rand_base64_24
REDIS_DB=0

# ============================================
# JWT Configuration
# ============================================
# ⚠️ CRITICAL: JWT 密钥要求
# - 长度: ≥32 字符
# - 复杂度: 必须高熵随机字符串
# - 禁止: 不能使用默认值或常见词
# - 轮换: 建议每 90 天轮换一次
#
# 生成强密钥命令:
# openssl rand -base64 48 | tr -d '\n' && echo
JWT_SECRET=CHANGE_ME_USE_openssl_rand_base64_48
JWT_EXPIRY=168h

# ============================================
# Storage Configuration (Cloudflare R2)
# ============================================
# ⚠️ 生产环境必须配置完整的 R2 凭证
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
CLOUDFLARE_ACCESS_KEY_ID=your_r2_access_key_id
CLOUDFLARE_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_BUCKET=tzblog-production
R2_PUBLIC_URL=https://cdn.yourdomain.com

# ============================================
# 安全检查清单
# ============================================
# 在部署前，请确认:
# [ ] 所有 CHANGE_ME 已替换为真实值
# [ ] 所有密钥使用 openssl 或 pwgen 生成
# [ ] DB_PASSWORD 长度 ≥32 字符
# [ ] REDIS_PASSWORD 长度 ≥16 字符
# [ ] JWT_SECRET 长度 ≥32 字符
# [ ] SERVER_BASE_URL 使用 https://
# [ ] DB_SSLMODE=require
# [ ] R2 配置完整
# [ ] 密钥已安全存储（不提交到版本控制）
# [ ] 已备份所有密钥到密钥管理系统

# ============================================
# 密钥轮换计划
# ============================================
# JWT_SECRET: 每 90 天轮换
# DB_PASSWORD: 每 180 天轮换
# REDIS_PASSWORD: 每 180 天轮换
# R2 密钥: 每 365 天轮换
#
# 详见: docs/security/key-rotation.md
```

#### Step 2.2: 更新 `.env.example` 注释

**修改**: `backend/.env.example`

在文件头部添加：

```bash
# ============================================
# TZBlog 开发环境配置
# ============================================
# ⚠️  这是开发环境配置，仅供本地开发使用
# ⚠️  生产环境请使用 .env.production.example
# ============================================
```

---

### Phase 3: 编写安全文档（2 小时）

#### Step 3.1: 生产配置指南

**新建文件**: `backend/docs/security/production-config.md`

**内容**:

```markdown
# 生产环境配置安全指南

## 概述

本文档说明 TZBlog 生产环境配置的安全要求和最佳实践。

## 配置文件

- 开发环境: `.env` (基于 `.env.example`)
- 生产环境: `.env.production` (基于 `.env.production.example`)

## 安全要求

### 1. HTTPS 强制

**要求**: 生产环境必须使用 HTTPS

```bash
# ✅ 正确
SERVER_BASE_URL=https://api.example.com

# ❌ 错误（应用会拒绝启动）
SERVER_BASE_URL=http://api.example.com
```

**原因**:
- 保护传输中的数据
- 防止中间人攻击
- 保护用户凭证

### 2. 数据库密码

**要求**:
- 长度: ≥32 字符
- 复杂度: 大小写字母 + 数字 + 特殊字符
- 熵: >3.5 (高熵)
- 禁止: 常见弱密码

**生成命令**:

```bash
# 方法 1: OpenSSL (推荐)
openssl rand -base64 32

# 方法 2: pwgen
pwgen -s 40 1

# 方法 3: Python
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

**示例**:

```bash
# ✅ 强密码 (40 字符, 高熵)
DB_PASSWORD=J8k2Np9xQm5Wz7vR3tYuB6nM4cX1aS0dF8hG2jK5

# ❌ 弱密码（应用会拒绝启动）
DB_PASSWORD=password123
DB_PASSWORD=tzblog
DB_PASSWORD=postgres
```

### 3. Redis 密码

**要求**:
- 长度: ≥16 字符
- 生产环境: 必须设置

**生成命令**:

```bash
openssl rand -base64 24
```

### 4. JWT 密钥

**要求**:
- 长度: ≥32 字符
- 熵: >4.0 (极高熵)
- 禁止: 默认值或常见词
- 轮换: 每 90 天

**生成命令**:

```bash
# 生成 48 字节 base64 编码 (推荐)
openssl rand -base64 48 | tr -d '\n' && echo
```

### 5. 数据库 SSL

**要求**: 生产环境必须启用

```bash
DB_SSLMODE=require
```

### 6. R2 配置

**要求**: 所有字段必填

```bash
CLOUDFLARE_ACCOUNT_ID=...
CLOUDFLARE_ACCESS_KEY_ID=...
CLOUDFLARE_SECRET_ACCESS_KEY=...
R2_BUCKET=...
R2_PUBLIC_URL=...
```

## 配置验证

应用启动时会自动验证配置：

### 开发环境

- 警告: 显示警告但允许启动
- 用途: 快速迭代

### 生产环境

- 阻断: 验证失败拒绝启动
- 错误信息: 清晰说明问题和修复方法

### 验证失败示例

```
CRITICAL: 配置验证失败: 生产环境必须使用 HTTPS
当前配置: SERVER_BASE_URL=http://api.example.com
修复方法: 将 SERVER_BASE_URL 改为 https://api.example.com
```

## 部署检查清单

在生产环境部署前，请确认:

- [ ] 使用 `.env.production.example` 作为模板
- [ ] 所有 `CHANGE_ME` 已替换为真实值
- [ ] 所有密钥使用密码生成器生成（不是手动输入）
- [ ] `DB_PASSWORD` ≥32 字符
- [ ] `REDIS_PASSWORD` ≥16 字符
- [ ] `JWT_SECRET` ≥32 字符
- [ ] `SERVER_BASE_URL` 使用 `https://`
- [ ] `DB_SSLMODE=require`
- [ ] R2 配置完整
- [ ] 密钥已备份到密钥管理系统
- [ ] `.env.production` 未提交到 Git
- [ ] 服务器文件权限正确 (`chmod 600 .env.production`)

## 密钥管理

### 存储

- **开发**: 本地 `.env` 文件
- **生产**: 环境变量或密钥管理系统

推荐的密钥管理系统:
- AWS Secrets Manager
- HashiCorp Vault
- Azure Key Vault
- Google Cloud Secret Manager

### 轮换周期

| 密钥类型 | 轮换周期 |
|---------|---------|
| JWT_SECRET | 90 天 |
| DB_PASSWORD | 180 天 |
| REDIS_PASSWORD | 180 天 |
| R2 密钥 | 365 天 |

详见: [key-rotation.md](./key-rotation.md)

## 应急响应

### 密钥泄露

如果密钥泄露，立即执行:

1. **隔离**: 撤销受影响的密钥
2. **轮换**: 生成新密钥并更新
3. **审计**: 检查是否有未授权访问
4. **通知**: 通知相关团队

详见: [key-rotation.md](./key-rotation.md) 的应急响应章节

## 常见问题

### Q: 为什么数据库密码要 32 字符？

**A**: 
- PostgreSQL 支持长密码
- 32 字符可抵御暴力破解
- 符合行业最佳实践

### Q: 可以在开发环境用弱密码吗？

**A**: 
- 可以，开发环境只显示警告
- 但建议开发也用强密码养成习惯

### Q: JWT_SECRET 泄露有什么影响？

**A**: 
- 攻击者可以伪造任意用户 Token
- 可以绕过认证获取所有数据
- **非常严重，需要立即轮换**

### Q: 如何测试配置验证？

**A**:

```bash
# 故意使用弱配置
export SERVER_MODE=production
export SERVER_BASE_URL=http://example.com

# 启动应用（应该失败并显示错误）
go run cmd/server/main.go
```

## 参考资料

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CIS Benchmarks](https://www.cisecurity.org/cis-benchmarks/)
- [NIST密码指南](https://pages.nist.gov/800-63-3/)
```

#### Step 3.2: 密钥轮换流程

**新建文件**: `backend/docs/security/key-rotation.md`

**内容**: (见下一个消息，内容较长)

---

### Phase 4: 集成测试与验证（1 小时）

#### Step 4.1: 手动测试

**测试用例**:

1. **弱 JWT_SECRET 测试**

```bash
# 设置弱密钥
export SERVER_MODE=production
export JWT_SECRET=short

# 启动应用（应该失败）
go run cmd/server/main.go

# 预期输出:
# FATAL: 配置验证失败: JWT_SECRET 至少 32 字符
```

2. **HTTP 测试**

```bash
export SERVER_MODE=production
export SERVER_BASE_URL=http://api.example.com

go run cmd/server/main.go

# 预期输出:
# FATAL: 配置验证失败: 生产环境必须使用 HTTPS
```

3. **弱数据库密码测试**

```bash
export SERVER_MODE=production
export DB_PASSWORD=password

go run cmd/server/main.go

# 预期输出:
# FATAL: 配置验证失败: 数据库密码不能使用常见弱密码
```

4. **成功启动测试**

```bash
# 使用强配置
export SERVER_MODE=production
export SERVER_BASE_URL=https://api.example.com
export JWT_SECRET=$(openssl rand -base64 48)
export DB_PASSWORD=$(openssl rand -base64 32)
export REDIS_PASSWORD=$(openssl rand -base64 24)

go run cmd/server/main.go

# 预期输出:
# INFO: 配置验证通过
# INFO: 服务器启动成功
```

#### Step 4.2: 单元测试

```bash
# 运行配置验证测试
go test ./config -v -run TestValidate

# 运行所有测试
go test ./... -cover
```

#### Step 4.3: 构建测试

```bash
# 编译检查
go build ./cmd/server

# 清理
rm -f server
```

---

## 4. 交付物

### 4.1 代码文件

- [x] `backend/config/validation.go` - 配置验证逻辑
- [x] `backend/config/config.go` - 修改：集成验证
- [x] `backend/config/config_test.go` - 补充：验证测试
- [x] `backend/.env.production.example` - 生产环境模板

### 4.2 文档文件

- [x] `backend/docs/security/production-config.md` - 生产配置指南
- [x] `backend/docs/security/key-rotation.md` - 密钥轮换流程
- [x] `docs/superpowers/plans/2026-06-17-prod-config-security.md` - 本计划文档

### 4.3 项目记忆更新

- [x] `memory-bank/systemPatterns.md` - 添加安全配置模式
- [x] `memory-bank/progress.md` - 记录本次任务完成

---

## 5. 验收标准

### 5.1 功能验收

- [ ] 生产环境弱配置拒绝启动
- [ ] 开发环境弱配置显示警告但允许启动
- [ ] 错误信息清晰易懂
- [ ] 所有验证规则正确执行

### 5.2 代码质量

- [ ] 单元测试覆盖率 ≥80%
- [ ] 所有测试通过
- [ ] `go vet` 无警告
- [ ] `golangci-lint` 无错误

### 5.3 文档完整性

- [ ] 生产配置指南完整
- [ ] 密钥轮换流程清晰
- [ ] 代码注释充分
- [ ] 示例代码可运行

---

## 6. 风险与应对

### 6.1 风险识别

| 风险 | 可能性 | 影响 | 应对措施 |
|------|-------|------|---------|
| 验证规则过严 | 中 | 中 | 提供清晰错误信息和修复建议 |
| 开发环境被阻断 | 低 | 高 | 开发环境只警告不阻断 |
| 现有配置不兼容 | 中 | 中 | 提供迁移指南 |
| 密钥轮换复杂 | 中 | 低 | 提供自动化脚本 |

### 6.2 回滚计划

如果验证逻辑导致问题:

1. **临时回滚**: 注释掉 `Validate()` 调用
2. **紧急修复**: 修改验证规则
3. **长期方案**: 优化验证逻辑和文档

---

## 7. 后续优化

### 7.1 自动化增强

- [ ] CI/CD 配置验证
- [ ] 密钥轮换脚本
- [ ] 配置模板生成器

### 7.2 监控告警

- [ ] 密钥即将过期告警
- [ ] 弱配置尝试次数监控
- [ ] 配置变更审计日志

### 7.3 文档完善

- [ ] 添加视频教程
- [ ] 多语言文档
- [ ] 常见问题扩展

---

## 8. 参考资料

- [OWASP Top 10 2021](https://owasp.org/Top10/)
- [CIS Benchmarks](https://www.cisecurity.org/cis-benchmarks/)
- [NIST SP 800-63B](https://pages.nist.gov/800-63-3/sp800-63b.html)
- [Go Security Best Practices](https://github.com/OWASP/Go-SCP)

---

**计划创建时间**: 2026-06-17  
**预计开始时间**: 2026-06-17  
**预计完成时间**: 2026-06-17  
**状态**: 待执行
