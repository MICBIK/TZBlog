# 生产环境配置安全指南

**最后更新**: 2026-06-17  
**维护者**: TZBlog Team

---

## 概述

本文档说明 TZBlog 生产环境配置的安全要求和最佳实践。

**重要**: 生产环境配置不当会导致严重安全问题，请严格遵守本指南。

---

## 配置文件

| 环境 | 配置文件 | 模板文件 | 用途 |
|------|---------|---------|------|
| 开发 | `.env` | `.env.example` | 本地开发 |
| 生产 | `.env.production` | `.env.production.example` | 生产部署 |

**注意**: 
- 配置文件不应提交到 Git (已在 `.gitignore` 中)
- 模板文件可以提交到 Git
- 生产配置必须存储在密钥管理系统中

---

## 安全要求

### 1. HTTPS 强制

**要求**: 生产环境必须使用 HTTPS

```bash
# ✅ 正确
SERVER_BASE_URL=https://api.example.com

# ❌ 错误（应用会拒绝启动）
SERVER_BASE_URL=http://api.example.com
```

**错误信息**:
```
FATAL: 配置验证失败: 生产环境必须使用 HTTPS
当前配置: SERVER_BASE_URL=http://api.example.com
修复方法: 将 SERVER_BASE_URL 改为 https://api.example.com
```

**原因**:
- 保护传输中的数据（防止窃听）
- 防止中间人攻击（MITM）
- 保护用户凭证（JWT Token）
- 符合现代 Web 安全标准

---

### 2. 数据库密码

**要求**:
- **长度**: ≥32 字符
- **复杂度**: 大小写字母 + 数字 + 特殊字符
- **熵**: ≥3.5 (高熵)
- **禁止**: 常见弱密码（password, admin, postgres, tzblog 等）

**生成命令**:

```bash
# 方法 1: OpenSSL (推荐)
openssl rand -base64 32

# 方法 2: pwgen
pwgen -s 40 1

# 方法 3: Python
python3 -c "import secrets; print(secrets.token_urlsafe(32))"

# 方法 4: 在线生成器
# https://www.random.org/strings/
```

**示例**:

```bash
# ✅ 强密码 (40 字符, 高熵)
DB_PASSWORD=J8k2Np9xQm5Wz7vR3tYuB6nM4cX1aS0dF8hG2jK5

# ❌ 弱密码（应用会拒绝启动）
DB_PASSWORD=password123       # 常见弱密码
DB_PASSWORD=tzblog            # 包含应用名称
DB_PASSWORD=postgres          # 数据库默认密码
DB_PASSWORD=12345678          # 纯数字
DB_PASSWORD=short             # 长度不足
```

**错误信息**:

```
# 长度不足
FATAL: 配置验证失败: 数据库密码长度必须至少 32 字符 (当前: 8 字符)
修复方法: 使用 openssl rand -base64 32 生成强密码

# 弱密码
FATAL: 配置验证失败: 数据库密码不能使用常见弱密码: password123
禁止使用: password, admin, postgres, tzblog 等常见词
修复方法: 使用 openssl rand -base64 32 生成强密码

# 熵过低
FATAL: 配置验证失败: 数据库密码熵过低 (当前: 2.8, 要求: ≥3.5)
这意味着密码复杂度不足，容易被破解
修复方法: 使用 openssl rand -base64 32 生成高熵密码
```

---

### 3. Redis 密码

**要求**:
- **长度**: ≥16 字符
- **生产环境**: 必须设置
- **开发环境**: 可选

**生成命令**:

```bash
# 推荐
openssl rand -base64 24

# 示例输出
# Kx9mP2nQ8wR5tY7uB3vC6aZ1sD4fG
```

**配置示例**:

```bash
# ✅ 正确
REDIS_PASSWORD=Kx9mP2nQ8wR5tY7uB3vC6aZ1sD4fG

# ❌ 错误（生产环境会拒绝启动）
REDIS_PASSWORD=              # 空密码
REDIS_PASSWORD=short         # 长度不足
```

**错误信息**:

```
FATAL: 配置验证失败: 生产环境必须设置 Redis 密码
修复方法: 设置 REDIS_PASSWORD，推荐使用: openssl rand -base64 24
```

---

### 4. JWT 密钥

**要求**:
- **长度**: ≥32 字符（推荐 48+ 字符）
- **熵**: ≥4.0 (极高熵)
- **禁止**: 默认值或常见词
- **轮换**: 每 90 天

**生成命令**:

```bash
# 推荐（生成 48 字节 base64 编码，约 64 字符）
openssl rand -base64 48 | tr -d '\n' && echo

# 示例输出
# Xp8mQ2nR9wK5tY7uB3vC6aZ1sD4fGhJ0kL3xM9nP8qW5tY7uB3vC6aZ1sD4fGh
```

**配置示例**:

```bash
# ✅ 正确
JWT_SECRET=Xp8mQ2nR9wK5tY7uB3vC6aZ1sD4fGhJ0kL3xM9nP8qW5tY7uB3vC6aZ1sD4fGh

# ❌ 错误（应用会拒绝启动）
JWT_SECRET=secret                                      # 默认值
JWT_SECRET=dev_secret_key_at_least_32_characters_long_12345  # 开发默认值
JWT_SECRET=your-secret-key-change-in-production        # 模板值
JWT_SECRET=short                                       # 长度不足
```

**错误信息**:

```
# 默认值
FATAL: 配置验证失败: JWT_SECRET 不能使用默认值或常见弱密钥
当前值: secret
修复方法: 使用 openssl rand -base64 48 生成强密钥

# 长度不足
FATAL: 配置验证失败: JWT_SECRET 长度必须至少 32 字符 (当前: 6 字符)
修复方法: 使用 openssl rand -base64 48 生成强密钥

# 熵过低
FATAL: 配置验证失败: JWT_SECRET 熵过低 (当前: 3.2, 要求: ≥4.0)
这意味着密钥复杂度不足，容易被破解
修复方法: 使用 openssl rand -base64 48 生成高熵密钥
```

**安全影响**:

JWT_SECRET 泄露的严重后果：
- ❌ 攻击者可以伪造任意用户的 Token
- ❌ 可以绕过认证获取所有数据
- ❌ 可以冒充管理员执行任意操作
- ⚠️ **必须立即轮换密钥并审计所有访问日志**

---

### 5. 数据库 SSL

**要求**: 生产环境必须启用

```bash
# ✅ 推荐配置
DB_SSLMODE=require        # 要求 SSL 但不验证证书
DB_SSLMODE=verify-ca      # 验证服务器证书（推荐）
DB_SSLMODE=verify-full    # 完整验证（最安全）

# ❌ 禁止配置（生产环境会拒绝启动）
DB_SSLMODE=disable        # 禁用 SSL
DB_SSLMODE=allow          # 可选 SSL
DB_SSLMODE=prefer         # 优先 SSL 但可降级
```

**错误信息**:

```
FATAL: 配置验证失败: 生产环境必须启用数据库 SSL
当前配置: DB_SSLMODE=disable
修复方法: 设置 DB_SSLMODE=require
```

**原因**:
- 保护数据库连接中的数据
- 防止数据库凭证被窃听
- 符合合规要求（PCI-DSS, GDPR）

---

### 6. R2 配置

**要求**: 生产环境所有字段必填

```bash
# ✅ 完整配置
CLOUDFLARE_ACCOUNT_ID=0f75d7da603d9923619845cde8c2213e
CLOUDFLARE_ACCESS_KEY_ID=a1b2c3d4e5f6g7h8i9j0
CLOUDFLARE_SECRET_ACCESS_KEY=k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
R2_BUCKET=tzblog-production
R2_PUBLIC_URL=https://cdn.example.com

# ❌ 错误（生产环境会拒绝启动）
CLOUDFLARE_ACCESS_KEY_ID=your_access_key_id_here  # 模板值
CLOUDFLARE_SECRET_ACCESS_KEY=                      # 空值
```

**获取 R2 凭证**:

1. 登录 Cloudflare Dashboard
2. 进入 R2 -> Manage R2 API Tokens
3. 创建 API Token
4. 复制 Account ID, Access Key ID, Secret Access Key

---

## 配置验证

应用启动时会自动验证配置。

### 开发环境

**行为**: 显示警告但允许启动

```bash
⚠️  WARNING: JWT_SECRET 长度不足 32 字符 (当前: 24)
   推荐生成命令: openssl rand -base64 48

⚠️  WARNING: 数据库密码使用了常见弱密码: tzblog
   推荐生成命令: openssl rand -base64 32

⚠️  WARNING: 未使用 HTTPS: http://localhost:8080
   生产环境将强制要求 HTTPS

INFO: 服务器启动成功 (开发模式)
```

**用途**: 快速迭代开发，不阻塞工作流

---

### 生产环境

**行为**: 验证失败拒绝启动，显示清晰错误信息

```bash
FATAL: 配置验证失败: 生产环境必须使用 HTTPS
当前配置: SERVER_BASE_URL=http://api.example.com
修复方法: 将 SERVER_BASE_URL 改为 https://api.example.com
```

**用途**: 防止不安全配置进入生产环境

---

## 部署检查清单

在生产环境部署前，请逐项确认：

### 配置文件

- [ ] 使用 `.env.production.example` 作为模板
- [ ] 所有 `CHANGE_ME` 已替换为真实值
- [ ] 所有密钥使用密码生成器生成（不是手动输入）
- [ ] `.env.production` 未提交到 Git

### 密钥强度

- [ ] `DB_PASSWORD` ≥32 字符
- [ ] `REDIS_PASSWORD` ≥16 字符
- [ ] `JWT_SECRET` ≥32 字符（推荐 48+ 字符）
- [ ] 所有密钥通过 `openssl rand` 或 `pwgen` 生成

### 网络安全

- [ ] `SERVER_BASE_URL` 使用 `https://`
- [ ] `DB_SSLMODE=require` 或更严格
- [ ] 防火墙规则配置正确
- [ ] 仅允许必要的入站端口（443, 8080）

### 存储配置

- [ ] R2 配置完整
- [ ] R2 凭证从 Cloudflare Dashboard 获取
- [ ] R2_PUBLIC_URL 使用 HTTPS

### 文件权限

- [ ] 服务器 `.env.production` 文件权限: `chmod 600`
- [ ] 配置文件所有者: 运行应用的用户

### 备份与审计

- [ ] 密钥已备份到密钥管理系统
- [ ] 记录密钥生成时间
- [ ] 设置密钥轮换提醒
- [ ] 配置变更已审计

---

## 密钥管理

### 存储方式

| 环境 | 推荐存储方式 |
|------|-------------|
| 开发 | 本地 `.env` 文件 |
| 生产 | 环境变量 + 密钥管理系统 |

**推荐的密钥管理系统**:

1. **AWS Secrets Manager** (推荐)
2. **HashiCorp Vault**
3. **Azure Key Vault**
4. **Google Cloud Secret Manager**
5. **1Password for Teams**

### 轮换周期

| 密钥类型 | 轮换周期 | 优先级 |
|---------|---------|--------|
| JWT_SECRET | 90 天 | P0 |
| DB_PASSWORD | 180 天 | P0 |
| REDIS_PASSWORD | 180 天 | P1 |
| R2 密钥 | 365 天 | P1 |

**详见**: [key-rotation.md](./key-rotation.md)

---

## 应急响应

### 密钥泄露处理流程

如果密钥泄露，**立即**执行：

#### 1. 隔离阶段 (0-15 分钟)

```bash
# 1. 撤销受影响的密钥（如果支持）
# 2. 临时禁用受影响的服务（如必要）
# 3. 通知团队
```

#### 2. 轮换阶段 (15-60 分钟)

```bash
# 生成新密钥
NEW_JWT_SECRET=$(openssl rand -base64 48)
NEW_DB_PASSWORD=$(openssl rand -base64 32)

# 更新配置
vi .env.production

# 重启服务
systemctl restart tzblog
```

#### 3. 审计阶段 (1-24 小时)

- [ ] 检查访问日志
- [ ] 查找未授权访问
- [ ] 确认攻击范围
- [ ] 生成事件报告

#### 4. 预防阶段 (1-7 天)

- [ ] 修复泄露原因
- [ ] 加强访问控制
- [ ] 更新安全流程
- [ ] 团队培训

**详见**: [key-rotation.md](./key-rotation.md) 的应急响应章节

---

## 常见问题

### Q1: 为什么数据库密码要 32 字符？

**A**: 
- PostgreSQL 支持长密码（无限制）
- 32 字符可抵御暴力破解（2^256 组合）
- 符合行业最佳实践（NIST, OWASP）
- 现代密码学推荐 256 位密钥

### Q2: 可以在开发环境用弱密码吗？

**A**: 
- **可以**，开发环境只显示警告，不阻断启动
- **但不推荐**，建议开发也用强密码养成安全习惯
- 可以使用密钥管理工具（如 1Password）统一管理

### Q3: JWT_SECRET 泄露有什么影响？

**A**: 
- ❌ 攻击者可以伪造任意用户 Token
- ❌ 可以绕过认证获取所有数据
- ❌ 可以冒充管理员执行任意操作
- ⚠️ **非常严重，需要立即轮换并审计**

### Q4: 如何测试配置验证？

**A**:

```bash
# 测试 1: 弱 JWT_SECRET
export SERVER_MODE=production
export JWT_SECRET=short
go run cmd/server/main.go
# 预期: FATAL 错误并拒绝启动

# 测试 2: HTTP in production
export SERVER_BASE_URL=http://example.com
go run cmd/server/main.go
# 预期: FATAL 错误并拒绝启动

# 测试 3: 强配置
export SERVER_BASE_URL=https://api.example.com
export JWT_SECRET=$(openssl rand -base64 48)
export DB_PASSWORD=$(openssl rand -base64 32)
export REDIS_PASSWORD=$(openssl rand -base64 24)
go run cmd/server/main.go
# 预期: 成功启动
```

### Q5: 开发环境可以跳过验证吗？

**A**:
- 开发环境只显示警告，不阻断启动
- 不能完全跳过验证（基本验证仍然执行）
- 这是设计决策，帮助开发者养成安全习惯

### Q6: 如何在 CI/CD 中使用强密钥？

**A**:

```yaml
# GitHub Actions 示例
env:
  JWT_SECRET: ${{ secrets.JWT_SECRET }}
  DB_PASSWORD: ${{ secrets.DB_PASSWORD }}
  REDIS_PASSWORD: ${{ secrets.REDIS_PASSWORD }}
```

在 GitHub Settings -> Secrets 中添加密钥。

### Q7: 熵是什么？为什么重要？

**A**:
- **熵 (Entropy)**: 衡量随机性的指标
- **Shannon 熵**: H = -Σ(p(x) * log₂(p(x)))
- **高熵**: 密钥难以预测，安全性高
- **低熵**: 密钥可预测，容易被破解

**示例**:

```
"aaaaaaaaaa" → 熵: 0.0 (完全可预测)
"password"   → 熵: 2.8 (低熵，不安全)
"P@ssw0rd!"  → 熵: 3.2 (中熵，可接受)
"K9x#mQ2n$R" → 熵: 4.1 (高熵，安全)
```

---

## 参考资料

### 标准与规范

- [OWASP Top 10 2021](https://owasp.org/Top10/)
- [CIS Benchmarks](https://www.cisecurity.org/cis-benchmarks/)
- [NIST SP 800-63B](https://pages.nist.gov/800-63-3/sp800-63b.html) - 数字身份指南
- [PCI-DSS 4.0](https://www.pcisecuritystandards.org/) - 支付卡行业数据安全标准

### 工具推荐

- [OpenSSL](https://www.openssl.org/) - 密钥生成
- [pwgen](https://github.com/tytso/pwgen) - 密码生成器
- [1Password](https://1password.com/) - 密钥管理
- [HashiCorp Vault](https://www.vaultproject.io/) - 企业密钥管理

### 延伸阅读

- [Go Security Best Practices](https://github.com/OWASP/Go-SCP)
- [Cloudflare R2 文档](https://developers.cloudflare.com/r2/)
- [PostgreSQL SSL 配置](https://www.postgresql.org/docs/current/ssl-tcp.html)

---

**文档版本**: 1.0  
**最后更新**: 2026-06-17  
**维护者**: TZBlog Team  
**反馈**: 如有问题请提交 Issue
