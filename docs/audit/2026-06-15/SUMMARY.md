# TZBlog 全量审计总报告（SUMMARY）

**审计时间**: 2026-06-15
**审计对象**: TZBlog 全栈博客系统（Go/Gin 后端 + Next.js 15 前端）
**审计基线 HEAD**: `44c3199 docs: 添加前后端集成测试报告`
**审计轮次**: 5 轮（安全 / 契约 / 后端质量 / 前端质量 / 工程化）
**审计性质**: 独立、只读全量复核；不盲信项目既有自评报告
**代码规模**: 后端 ~12,000 行 Go（+12,000 行测试）/ 前端 ~6,100 行 TS/TSX

---

## 📌 一句话结论

> **后端架构骨架健康、前端前台达到生产级，但存在 1 个 BLOCKER 级安全失效（CSRF）、前后端写操作契约断裂、最核心包测试无法运行、以及大量"自评已修复实则未生效"的漏洞。当前综合评分 56/100，不建议直接上线。**

---

## 📊 问题总览

### 按严重程度

| 级别 | 数量 | 代表问题 |
|------|------|---------|
| 🔴 BLOCKER | 6 | CSRF 双重失效、文章写操作必失败、DTO 命名混乱、详情无 author/tags、handlers 测试编译失败、cmd/server 测试 panic |
| 🟠 HIGH | 13 | 登录无限流、用户枚举、改密不撤销 token、文件上传仅查扩展名、刷新掉登录、前端零测试、后端无 CI、Docker root 运行、readiness 空壳 等 |
| 🟡 MEDIUM | 13 | 限流 cleanup、mock 混入生产、bundle 未核查、迁移编号冲突、SSR API URL 等 |
| **合计** | **32** | — |

### 按维度

| 维度 | 评分 | 状态 |
|------|------|------|
| 安全（R1） | 55/100 | 🔴 CSRF 失效 + 多个 HIGH 未真修 |
| 前后端契约（R2） | 45/100 | 🔴 写路径全面断裂 |
| 后端质量/测试（R3） | 55/100 | 🔴 核心包测试跑不了，真实覆盖率 50.5% |
| 前端质量（R4） | 80/100 | 🟢 最成熟的部分 |
| 工程化/部署（R5） | 45/100 | 🔴 后端无 CI、二进制入库、可观测性虚假 |
| **综合** | **56/100 (D+)** | 🔴 不建议直接上线 |

> 与项目既有自评（90/100，"强烈推荐部署"）存在 **34 分落差**，主要来自：CSRF 实际失效、契约断裂、测试无法运行、工程化短板——这些在自评中被标为"已修复/已完成"。

---

## 🔴 六大 BLOCKER 详解

### B1. CSRF 防护完全失效（安全剧场）— R1 SEC-1-01
三重断裂：中间件顺序错（永远跳过）+ cookie httpOnly（前端读不到）+ 前端完全不接入。看似有完整的 CSRF 中间件和"SEC-006 FIX"注释，实则**零防护**。

### B2. 文章写操作前后端路由不匹配（id vs slug）— R2 CONTRACT-1-01
后端 `PUT/DELETE /articles/:slug`，前端发 `PUT /articles/${id}` → 后端把数字 id 当 slug 查 → **更新/删除 100% 失败**。

### B3. DTO 字段命名 snake_case vs camelCase 混用 — R2 CONTRACT-1-02
`cover_image`/`display_name`/`current_password` 等写接口字段，前端用 camelCase 对不上。前端尚未实现这些 UI（定时炸弹）。

### B4. 列表返回全文 + 详情拿不到 author/tags — R2 CONTRACT-1-03
repo 无 `Omit("content")`（列表泄露全文）、无 `Preload` 且关联字段标 `gorm:"-"`（详情 author/tags 永远 null）。

### B5. handlers 包测试编译失败 — R3 QUAL-3-01
`MockArticleService` 缺 `BatchDelete` 方法 → 整个 API 层测试 0 运行 → 历史"安全验证"无法复现。

### B6. cmd/server 测试 init panic — R3 QUAL-3-01
`promauto` 在 init() 注册指标，测试时重复注册崩溃 → cmd/server 测试无法运行。

---

## 🛣️ 修复路线图（按优先级）

### Phase 0：阻断上线项（必须，预计 2-3 天）
- [ ] **B1 CSRF**：要么修三处断裂（中间件顺序+cookie+前端接入），要么因 Bearer Token 天然免疫而移除 CSRF 并文档说明。
- [ ] **B5/B6 测试可运行**：补 Mock 方法 + 改 Prometheus 注册方式。这是所有后续修复的"安全网"。
- [ ] **INFRA-5-01**：`.gitignore` 补全 + 从仓库移除 100MB 二进制。

### Phase 1：核心契约修复（预计 3-5 天）
- [ ] **B2 文章写操作**：统一 id 或 slug 策略，前后端对齐。
- [ ] **B4 数据完整性**：列表 `Omit("content")`，详情 Preload author/tags（改 `gorm:"-"` 为关联）。
- [ ] **B3 字段命名**：全链路统一 camelCase（改 DTO JSON tag）。
- [ ] **CONTRACT-1-04 刷新登录**：Providers 调 `/auth/me` 恢复 user。

### Phase 2：安全 HIGH 项（预计 2-3 天）
- [ ] **SEC-1-02** 登录挂载限流中间件。
- [ ] **SEC-1-03** 用户枚举：统一错误响应。
- [ ] **SEC-1-05** 改密撤销旧 token。
- [ ] **SEC-1-04** 文件上传检测真实 MIME（魔数）。

### Phase 3：工程化补齐（预计 2-3 天）
- [ ] **INFRA-5-02** 新增后端 CI（vet/build/test）。
- [ ] **INFRA-5-03** 后端 Dockerfile 非 root + 锁版本 + HEALTHCHECK + .dockerignore。
- [ ] **INFRA-5-04** readiness 真实探活 + service 层补日志。

### Phase 4：质量提升（持续）
- [ ] 后端覆盖率 50.5% → 70%（重点 handlers/repository/email/search/seo）。
- [ ] 前端补测试（client 拦截器、authStore、关键页面）。
- [ ] 清理死代码（616 行未挂载 handler、.bak、垃圾函数、未用 repo）。
- [ ] 补全前端写功能 UI（改资料/改密码/编辑文章）。

### Phase 5：优化（可选）
- [ ] INFRA-5-05 迁移编号去重。
- [ ] INFRA-5-06 SSR API URL 区分服务端/客户端。
- [ ] QUAL-4-04 bundle 懒加载核查。

---

## ✅ 项目真实亮点（客观记录）

为避免"全盘否定"，记录项目确实做得好的部分：

1. **前端是生产级水准**：零 any、Server Component + ISR、动态 metadata、错误降级、Zustand hydration、设计 1:1 还原——这部分质量远超一般个人项目。
2. **后端架构骨架健康**：Service/Repository 接口化、AppError 错误体系、时间类型统一、连接池监控——旧报告这些修复属实。
3. **安全基本功扎实**：JWT 算法校验、密钥强度启动校验、bluemonday XSS 清洗、SQL 全参数化、bcrypt 密码哈希——这些传统高危领域做得好。
4. **数据库迁移规范**：幂等检查、回滚文件、索引专项迁移。
5. **前端 Dockerfile 生产级**：多阶段、standalone、非 root。

问题主要集中在**"接口契约层"和"工程纪律层"**，而非"实现能力"。

---

## 📁 审计产出文件

```
docs/audit/2026-06-15/
├── round-0-baseline.md            # 基线（编译/测试/覆盖率实测）
├── round-1-security.md            # 安全（1 BLOCKER + 4 HIGH + 4 MEDIUM）
├── round-2-contract.md            # 契约（3 BLOCKER + 3 HIGH + 2 MEDIUM）
├── round-3-backend-quality.md     # 后端质量（1 BLOCKER + 3 HIGH + 3 MEDIUM）
├── round-4-frontend-quality.md    # 前端质量（0 BLOCKER + 2 HIGH + 3 MEDIUM）
├── round-5-infra-and-summary.md   # 工程化（0 BLOCKER + 4 HIGH + 3 MEDIUM）
└── SUMMARY.md                     # 本文件
```

---

**审计完成**: 2026-06-15
**审计人**: ZCode 独立全量审计
**建议下一步**: 按路线图 Phase 0 → 1 → 2 顺序修复，优先处理测试可运行性（B5/B6）以为后续修复提供回归保护。
