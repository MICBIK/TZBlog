# 第 5 轮：性能 / 数据库 / 工程化 / 部署就绪度审计报告

**审计时间**: 2026-06-15
**审计范围**: 数据库迁移 / N+1 / Docker / CI/CD / gitignore / 依赖漏洞 / 可观测性 / 生产就绪度独立评分
**审计性质**: 只读，独立复核当前 HEAD（`44c3199`）

---

## 📊 本轮摘要

| 维度 | 结论 |
|------|------|
| 数据库迁移（幂等/回滚） | ✅ 优秀（但 000003 编号冲突） |
| N+1 查询 | 🟠 HIGH：列表/详情无 Preload，author/tags 查不出（见 R2） |
| 索引 | ✅ 000002 专项加索引迁移 |
| 前端 Dockerfile | ✅ 优秀（多阶段/standalone/非root） |
| 后端 Dockerfile.prod | 🔴 HIGH：root 运行 + alpine:latest 未锁 + Go 版本不一致 + 无 HEALTHCHECK |
| CI/CD | 🟠 HIGH：仅前端 CI，**后端无 CI**；前端 typecheck 会假阳性 |
| gitignore / 构建产物 | 🔴 见基线 B-0-1：100MB+ 二进制入库 |
| 依赖漏洞 | ⚠️ 无法检测（pnpm audit 镜像源不支持） |
| 可观测性 | 🟠 HIGH：ReadinessCheck 空壳 + service 层无日志 |
| docker-compose SSR | 🟡 MEDIUM：localhost API URL 对容器 SSR 无效 |

**本轮发现问题**: 0 BLOCKER + 4 HIGH + 3 MEDIUM

---

## 🟠 HIGH

### INFRA-5-01：100MB+ 构建产物被纳入 git 版本控制

**（基线 B-0-1 详述，此处归档到工程化维度）**

```
backend/bin/server          ~56 MB  ← git 追踪
backend/monitoring_demo     ~46 MB  ← git 追踪
合计                        ~102 MB 进仓库
```

`.gitignore` 忽略了 `*.exe`/`*.test`/`dist/`/`build/`，但**未忽略**：
- `backend/server`（无扩展名的 Go 默认输出名）
- `backend/bin/`（整个 bin 目录）
- `backend/monitoring_demo`（早期误提交的二进制）

**影响**：仓库 clone/pull 缓慢；`.git` 目录膨胀；每次改动二进制都产生巨量 diff。

**修复**：
1. `.gitignore` 追加：`backend/server`、`backend/bin/`、`backend/monitoring_demo`、`backend/coverage.out`、`backend/full_test.txt`、`backend/test_output.txt`。
2. 从历史中清除：`git filter-repo --path backend/bin/server --invert-paths`（或 BFG），然后 force push（需团队协调）。

---

### INFRA-5-02：后端无 CI/CD（无自动化测试/构建拦截）

**现状**: `.github/workflows/` 只有 `frontend-ci.yml`（前端 lint+typecheck+build）和 `branch-protection.yml`。**没有后端 CI**。

**影响**：
- 第 3 轮发现的 handlers 测试编译失败、cmd/server panic、死代码、`go build ./...` 失败等问题，**没有任何自动化拦截**——全靠人工发现。
- 后端可以提交无法编译/测试全红的代码到 main 而无报警。
- 后端没有 `go vet`、`golangci-lint`、`go test -race` 的质量门禁。

**修复**: 新增 `.github/workflows/backend-ci.yml`：
```yaml
- run: go vet ./...
- run: go build ./...           # 捕获 examples 编译错误
- run: go test ./... -race -cover
- run: golangci-lint run         # 可选，静态分析
```

---

### INFRA-5-03：后端 Dockerfile.prod 容器安全问题

**位置**: `backend/Dockerfile.prod`

| 问题 | 详情 | 风险 |
|------|------|------|
| **以 root 运行** | `WORKDIR /root/`，无 `USER` 指令 | 🔴 容器逃逸时获得 root 权限 |
| **基础镜像未锁版本** | `FROM alpine:latest` | 🟠 不可复现构建，可能引入Breaking change |
| **Go 版本不一致** | `FROM golang:1.25-alpine`，但 `go.mod` 声明 `go 1.22` | 🟠 构建环境与声明不符 |
| **无 HEALTHCHECK** | 代码有 `/health` 但 Dockerfile 未声明 | 🟡 编排器无法自动探活 |
| **无 .dockerignore** | `COPY . .` 会把 bin/server(56MB)、monitoring_demo(46MB)、coverage.out 都拷进构建上下文 | 🟠 构建上下文膨胀、泄露产物 |

**对比**: 前端 `frontend/Dockerfile` 质量极高（多阶段、`USER nextjs` 非 root、standalone、详尽注释）——前后端 DevOps 成熟度差距巨大。

**修复**（对齐前端 Dockerfile 水准）：
```dockerfile
FROM golang:1.22-alpine AS builder   # 锁版本，与 go.mod 一致
...
FROM alpine:3.20                     # 锁版本
RUN addgroup -S app && adduser -S app -G app
COPY --from=builder --chown=app:app /app/server .
USER app
HEALTHCHECK --interval=30s CMD wget -qO- http://localhost:8080/health || exit 1
```
并新增 `backend/.dockerignore`（排除 `bin/`、`*.bak`、`coverage.out`、`server`、`monitoring_demo`）。

---

### INFRA-5-04：可观测性虚假（ReadinessCheck 空壳 + service 无日志）

**问题 A — ReadinessCheck/HealthCheck 永远返回 ok**

`backend/cmd/server/main.go:400-419`：
```go
func HealthCheck(db interface{}, redis interface{}) gin.HandlerFunc {
    return func(c *gin.Context) {
        c.JSON(http.StatusOK, gin.H{"status": "ok", ...})  // ← db/redis 参数没用
    }
}
func ReadinessCheck(db interface{}, redis interface{}) gin.HandlerFunc {
    return func(c *gin.Context) {
        // TODO: check database and Redis connectivity
        c.JSON(http.StatusOK, gin.H{"status": "ready", ...})  // ← 永远 ready
    }
}
```

DB/Redis 全挂时仍返回 200/ready。Kubernetes/deploy 据此把流量打到**连不上数据库的实例**，用户看到 500。

**问题 B — service 层完全没有日志**

grep `logger.(Error|Warn|Info)` 在 `internal/service/auth_service.go`、`article_service.go` 中返回**空**。service 层是业务核心（登录、改密、文章 CRUD），但任何错误、异常分支都不打日志。第 3 轮发现的 3 处 `_ =` 吞错，因无日志而**完全不可追踪**。生产排障将无据可依。

**修复**：
- A: 真实 ping DB（`db.Ping()`）和 Redis（`redisClient.Ping()`），失败返回 503。
- B: service 层关键路径加 `logger.Info/Error`（登录成功/失败、文章创建/删除、异常分支）。

---

## 🟡 MEDIUM

### INFRA-5-05：迁移文件编号冲突（两个 000003）

`backend/migrations/`：
```
000003_convert_likes_to_polymorphic.up.sql
000003_convert_likes_to_polymorphic.down.sql
000003_optimize_schema.up.sql
000003_optimize_schema.down.sql
```

**两个不同的迁移共享编号 000003**。大多数迁移工具（golang-migrate、goose）按编号严格排序执行，冲突会导致：
- 工具报错（best case）。
- 只执行其中一个（worst case，静默丢失另一个迁移）。

**修复**: 重编号其中一个（如 `000003_optimize_schema` → `000006_optimize_schema`），确保序列唯一递增。

---

### INFRA-5-06：docker-compose 的 API URL 对容器 SSR 无效

`docker-compose.yml:18`：
```yaml
- NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
```

前端容器是 Next.js，详情页/首页是 **Server Component + ISR**，在**容器内服务端渲染时**调 `getArticles()` → axios 请求 `http://localhost:8080`。但容器内的 `localhost` 指向**前端容器自身**（3000），不是后端。

**影响**: 容器化部署时，SSR 数据获取会失败（连接拒绝），首页/列表页降级为空（`.catch(() => [])` 兜底，不报错但无数据）。

**修复**: 服务端数据获取应使用容器网络可寻址的后端地址，如 `http://backend:8080/api/v1`（docker-compose 服务名）。但 `NEXT_PUBLIC_` 前缀变量会暴露给客户端，需区分：
- 服务端用：`API_INTERNAL_URL=http://backend:8080/api/v1`（不带 NEXT_PUBLIC_）。
- 客户端用：`NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1`（公网地址）。
- `lib/api/client.ts` 需根据 `typeof window` 选择不同 base URL。

---

### INFRA-5-07：依赖漏洞无法检测（pnpm audit 失效）

`pnpm audit` 报错：
```
[ERR_PNPM_AUDIT_ENDPOINT_NOT_EXISTS] The audit endpoint
(at https://registry.npmmirror.com/...) doesn't exist.
```

团队使用 npmmirror 国内镜像，该镜像不实现 audit 接口。结果：**前端依赖的已知 CVE 无法被检测**。

**修复**：
- CI 中临时切回官方 registry 跑 audit：`pnpm audit --registry=https://registry.npmjs.org`。
- 或用 `npm audit --json` / Dependabot / Snyk 等替代方案。
- 后端同理需定期 `govulncheck ./...`（Go 官方漏洞检查）。

---

## ✅ 工程化亮点（客观记录）

| 项 | 说明 |
|----|------|
| 迁移幂等性 | `000001` 有 `DO $$ ... IF EXISTS ... RETURN` 幂等检查 ✅ |
| 迁移回滚 | 每个迁移都有 `.down.sql` ✅ |
| 迁移脚本 | `test_migrations.sh`、`verify_000004.sh` 自动化验证 ✅ |
| 索引专项迁移 | `000002_add_indexes` 单独加索引 ✅ |
| 前端 Dockerfile | 多阶段 + standalone + 非 root + 注释详尽，生产级 ✅ |
| 前端 CI | lint + typecheck + build 完整流水线 ✅ |
| 分支保护 | `branch-protection.yml` + husky commit-msg/pre-commit 强制规范 ✅ |
| Prometheus 指标 | HTTP/DB/Cache 指标已埋点（虽 init 有 panic 问题，见 R3）✅ |
| 优雅关闭 | main.go signal 处理 + timeout ✅ |
| 连接池监控 | `config/pool_monitor.go` ✅ |

---

## 🎯 生产就绪度独立评分

> 此评分独立于旧报告的自评（旧报告自评 90/100），基于本次 5 轮审计的实测发现。

| 维度 | 本次评分 | 旧自评 | 差距 | 说明 |
|------|---------|--------|------|------|
| 功能完整性（读路径） | 85 | 100 | -15 | 公共前台完整；写路径多数缺失 |
| 功能完整性（写路径） | 40 | — | — | 改资料/改密码/编辑文章前端未实现 |
| **安全性** | **55** | 92 | **-37** | CSRF 完全失效、登录无限流、改密不撤销 token、文件上传仅查扩展名 |
| **前后端契约** | **45** | 未评 | — | 文章写操作必失败、DTO 命名混乱、详情无 author/tags |
| 代码质量（后端） | 60 | 88 | -28 | 死代码多、错误吞、垃圾函数 |
| 代码质量（前端） | 80 | — | — | 零 any、ISR、SSR 优秀；缺测试 |
| **测试覆盖（后端）** | **50.5%** | 68% | **-17.5** | handlers/cmd 测试跑不了 |
| 测试覆盖（前端） | 0% | — | — | 零测试 |
| 性能 | 55 | 70 | -15 | 列表返回全文、N+1、无 Preload |
| 数据库 | 75 | 75 | 0 | 迁移规范；但 000003 冲突 |
| **工程化/CI** | **45** | — | — | 后端无 CI、二进制入库、Docker 安全差 |
| 可观测性 | 40 | — | — | readiness 空壳、service 无日志 |
| 部署就绪度 | 50 | 100 | -50 | 多个阻断项 |

### 综合评分: **56/100（D+）** — 旧自评 90 分显著偏乐观

**不建议当前状态直接上线生产环境。** 核心阻断项见下方路线图。

---

## 本轮结论

工程化层面暴露了**前后端 DevOps 成熟度的巨大落差**：前端有完整的 CI、生产级 Dockerfile；后端无 CI、Docker 安全差、100MB 二进制入库、可观测性虚假。数据库迁移本身写得规范（幂等、回滚、索引专项），但 000003 编号冲突是个隐患。

可观测性是最被忽视的维度——readiness 永远 ready、service 层零日志，意味着生产环境一旦出问题，**几乎没有排查线索**。这不是"锦上添花"，而是运维的基本生存需求。
