# 第 0 轮：审计基线（Round 0 — Baseline）

**审计时间**: 2026-06-15
**审计对象 HEAD**: `44c3199 docs: 添加前后端集成测试报告`
**工作区状态**: clean（最后的提交已完成）
**审计人**: 独立全量审计（ZCode）
**审计性质**: 只读审计，不修改业务代码

---

## 1. 审计范围

| 维度 | 范围 | 规模 |
|------|------|------|
| 后端 | Go 1.22 + Gin + GORM + Redis + PostgreSQL | 生产代码 11,972 行 / 测试 12,174 行 / 154 个 .go 文件 |
| 前端 | Next.js 15 + React 19 + TS + Tailwind v4 + Zustand + React Query | 6,114 行 / 80 个 ts·tsx 文件 |
| 基础设施 | Docker / docker-compose / GitHub Actions / Husky | — |

> 说明：此前项目已有大量阶段性审计（2026-06-14，自评已修复至 90 分），但那些审计为**自评**且**偏后端**。本次为独立全量复核，重点验证当前真实状态，并补齐前端深度、前后端契约、工程化等此前薄弱的维度。

---

## 2. 编译 / 测试基线（独立实测）

### 2.1 后端

| 项目 | 结果 | 备注 |
|------|------|------|
| `go build ./cmd/server/` | ✅ 通过 | exit 0 |
| `go vet ./...` | ❌ **失败** | `article_handler_test.go:156` 的 `*MockArticleService` 未实现 `article.Service`（缺 `BatchDelete` 方法） |
| `go test ./...` | ❌ **2 包 FAIL** | `cmd/server` 与 `internal/api/handlers`（handlers 测试编译失败） |

### 2.2 后端测试覆盖率（实测，非自评）

| 包 | 覆盖率 | 说明 |
|----|--------|------|
| config | 21.5% | 偏低 |
| internal/api/middleware | 54.0% | — |
| internal/api/response | 76.7% | ✅ |
| internal/api/handlers | **编译失败** | ❌ 测试根本无法运行 |
| internal/audit | **0.0%** | 无测试 |
| internal/cache | 62.2% | — |
| internal/domain/* | 73–100% | ✅ 良好 |
| internal/email | **0.0%** | 无测试 |
| internal/monitoring | 35.0% | — |
| internal/repository/postgres | 40.0% | ⚠️ 数据层偏低 |
| internal/search | **0.0%** | 无测试 |
| internal/seo (含 sitemap) | **0.0%** | 无测试 |
| internal/service | 66.4% | — |
| pkg/apikey | 81.1% | ✅ |
| pkg/auth | 70.6% | — |
| pkg/errors | 35.3% | — |
| pkg/logger | 57.7% | — |
| pkg/sanitizer | 100% | ✅ |
| pkg/storage | 61.6% | — |
| pkg/validator | 100% | ✅ |

**结论**: 旧报告自评"整体 68%"过于乐观——实测中 handlers 包测试根本无法编译，email/search/seo/audit 四个模块覆盖率为 0，repository（数据层）仅 40%。真实加权覆盖率需在第 3 轮精确测算。

### 2.3 前端

| 项目 | 结果 | 备注 |
|------|------|------|
| `pnpm typecheck` | ❌ **失败** | `.next/types/validator.ts` 引用了不存在的 `app/(dashboard)/admin/analytics/page.js` 与 `admin/media/page.js`（疑似构建缓存残留或路由删除后未清理 `.next`） |
| `pnpm lint` | ✅ 通过 | 无告警 |

> 前端 typecheck 失败可能是 `.next` 缓存问题（`pnpm build` 后会重新生成），需在第 4 轮确认是缓存问题还是真实路由缺失。但 `tsc --noEmit` 在 CI 中会同样失败，属于需要修复的真实问题。

---

## 3. 已发现的真实问题（基线阶段，将在对应轮次展开）

### 🔴 B-0-1：两个大二进制文件被纳入 git 版本控制

```
backend/bin/server          56,293,810 bytes (~56 MB)  ← 已追踪
backend/monitoring_demo     46,787,506 bytes (~46 MB)  ← 已追踪
```

- **影响**：仓库膨胀超 100MB；每次 clone/pull 都拉取无用产物；`backend/bin/server` 是编译产物，不应入库。
- **根因**：`.gitignore` 忽略了 `*.exe`/`*.test` 等但**未忽略 Go 默认输出名 `server`/`bin/`**；`monitoring_demo` 早期误提交。
- **归属**：第 5 轮（工程化）展开 + 给出清理方案。

### 🔴 B-0-2：handlers 测试包编译失败（Mock 与接口不同步）

- `article_handler_test.go` 的 `MockArticleService` 缺 `BatchDelete` 方法，导致整个 handlers 包测试无法编译运行。
- **影响**：handlers 是最核心的 API 层，其测试完全失效，旧报告的安全修复"13/13 验证通过"无法复现。
- **归属**：第 3 轮展开。

### 🟠 B-0-3：前端 typecheck 失败

- `.next/types/validator.ts` 引用已删除的 `admin/analytics`、`admin/media` 路由产物。
- **归属**：第 4 轮确认根因。

### 🟡 B-0-4：`examples/` 目录 `package main` 无 main 函数

- `examples/performance_optimization_example.go` 声明 `package main` 但无 `main()`，导致 `go build ./...` 在该目录报错（不影响主程序编译，但影响 `go build ./...` 与 CI）。
- **归属**：第 3 轮。

### 🟡 B-0-5：遗留 `.bak` 备份文件入库

```
backend/cmd/server/main.go.bak
backend/internal/service/auth_service.go.bak
```
- **归属**：第 3 轮（死代码/遗留物）。

---

## 4. 五轮审计计划（确认版）

| 轮次 | 主题 | 核心检查项 | 产出 |
|------|------|-----------|------|
| **R1** | 安全 | JWT 算法校验/密钥强度、Token 黑名单、鉴权链路、越权、限流、SQL 注入、XSS、CSRF（前后端契约）、CORS、文件上传、密钥/配置 | round-1-security.md |
| **R2** | 前后端契约 + 集成 | 响应信封、字段命名（snake/camel）、错误码、路由表对齐、认证全链路、CSRF token 流转、分页参数 | round-2-contract.md |
| **R3** | 后端质量 + 架构 + 测试 | 分层职责、依赖注入、错误处理、并发安全、死代码（.bak/未用 repo/examples）、时间类型、真实覆盖率与测试质量 | round-3-backend-quality.md |
| **R4** | 前端质量 + 类型 + 性能 | typecheck 根因、any 滥用、Server/Client 边界、Zustand hydration、SSR/SSG/ISR、bundle 体积、React Query 配置、SEO/可访问性 | round-4-frontend-quality.md |
| **R5** | 性能/DB/工程化/部署 + 总报告 | 迁移幂等/锁表、N+1、索引、Docker 镜像安全、CI/CD 覆盖、gitignore、依赖漏洞、可观测性、生产就绪度独立评分 | round-5-infra-and-summary.md + SUMMARY.md |

每轮结束向用户汇报关键发现，再进入下一轮。
