# 第 0 轮：审计基线（编译 / 测试 / 构建 / 覆盖率实测）

**审计时间**: 2026-06-16
**审计基线 HEAD**: `b130dd8 chore: checkpoint before 1:1 prototype migration (21 screens)`
**审计性质**: 独立、只读全量复核；所有数据均为本机实测，不引用自评。
**对比对象**: 2026-06-15 首轮审计（基线 `44c3199`，综合 56/100）

---

## 📊 基线快照

| 指标 | 本次实测 (2026-06-16) | 上次 (2026-06-15) | 趋势 |
|------|----------------------|-------------------|------|
| 后端 Go 代码行数 | ~32,733 | ~12,000 | ▲ 增长（含测试） |
| 前端 TS/TSX 代码行数 | **12,927** | ~6,100 | ▲ **翻倍（1:1 复刻）** |
| 前端路由数 | **21** | — | 新增 marketing/library/pathways/works/account/sections |
| 后端 `go build ./...` | ❌ **失败**（examples 包） | 失败 | ⚠️ 仍未修 |
| 后端 `go vet ./...` | ✅ 通过 | — | — |
| 后端 `go test ./...` | ❌ **FAIL**（postgres 包 6 项） | handlers/cmd panic | 🔄 回归转移 |
| 前端 `pnpm typecheck` | ✅ 通过 | — | — |
| 前端 `pnpm build` | ✅ **通过（21 路由全部生成）** | — | — |
| 后端整体覆盖率 | ~52%（首测包数据） | 50.5% | 持平 |
| 前端测试 | **0%**（零测试） | 0% | ⚠️ 复刻后仍未补 |

---

## 🔴 基线发现的关键阻断项（BLOCKER）

### B-0-1：`go build ./...` 失败 — examples 包非法声明

**命令**:
```bash
$ cd backend && go build ./...
# github.com/MICBIK/TZBlog/backend/examples
runtime.main_main·f: function main is undeclared in the main package
```

**根因**: `backend/examples/` 目录下同时存在两个文件，均声明 `package main`：
- `examples/monitoring_demo/main.go` ✅ 有 `func main()`
- `examples/performance_optimization_example.go` ❌ 声明 `package main` 但**只有 `func Example(...)`，无 `func main()`**

Go 要求 `package main` 必须含 `main` 函数。两个 `main` 包文件合并后，编译器找不到统一的 `main` 入口 → 编译失败。

**影响**:
- `go build ./...`（CI/CD 标准命令）**必然失败** → 若后端 CI 跑 `go build ./...` 会一直红。
- `backend-ci.yml` 已新增（见下），但其 `go build ./...` 步骤实际上无法通过。

**修复**（二选一）：
1. 将 `performance_optimization_example.go` 改为 `package examples`（或移入子目录 `examples/performance/`，声明独立包）。
2. 若确需保留为可运行示例，补一个 `func main()`，或将两个示例合并到各自的子目录。

---

### B-0-2：后端 `go test ./...` FAIL — postgres 仓库层 6 项测试失败

**失败清单**（全部位于 `internal/repository/postgres/article_repo_test.go`）：
```
--- FAIL: TestArticleRepository_FindByID           /found
--- FAIL: TestArticleRepository_FindBySlug         /found
--- FAIL: TestArticleRepository_Update
--- FAIL: TestArticleRepository_IncrementViewCount
--- FAIL: TestArticleRepository_Update_PartialFields
--- FAIL: TestArticleRepository_IncrementViewCount_Multiple
```

**错误信息**:
```
no such table: users
```

**根因（回归）**: 上一轮 B4 修复——让 `FindByID`/`FindBySlug` 调用 `Preload("Author").Preload("Tags")`——**已写入生产代码**（`article_repo.go:33,48`），但**测试 fixture `setupArticleTestDB` 未同步更新**：它只 `CREATE TABLE articles` 和 `article_tags`，没有建 `users`/`tags` 表。于是 `Preload("Author")` 触发 `SELECT * FROM users` → 报 `no such table: users`。

**佐证**: 同文件中 `TestArticleRepository_FindByID_WithAuthorAndTags`（test:307）在 setup 里**额外**执行了 `CREATE TABLE users/tags`，所以该测试 PASS——这反向证明问题就是 fixture 漏建表。

**影响**:
- 后端测试套件 **整体变红**（`go test ./...` 退出码 1）。
- 这是上轮 B4 的"修复了一半"：业务代码改了，测试没跟上 → **修复未被任何自动化验证保护**，未来极易再次回归。
- 违反"代码与测试同步"原则；上轮报告明确建议"先修测试可运行性（B5/B6）再做后续修复"，但本次在 B4 修复时跳过了测试。

**修复**: 在 `setupArticleTestDB`（test:14）的 SQL 中补建 `users`、`tags` 表（最小 schema 即可：`id`、`username`/`name` 等 `Preload` 需要的列），或改为 `db.AutoMigrate(&article.Article{}, &user.User{}, &tag.Tag{}, ...)`。

---

### B-0-3：100MB+ 二进制仍残留版本库（`.gitignore` 已补但未 `git rm`）

**实测**: `git ls-files` 仍包含：
```
backend/server    57 MB   ← 仍在版本库
```

`.gitignore` 本次已正确补上规则（`backend/server`、`backend/bin/`、`backend/monitoring_demo`、`backend/cmd/server/server` 等），但 **`.gitignore` 不会移除已追踪文件**，需要显式 `git rm --cached backend/server` 并提交。

**对比上次**: 上次 `backend/bin/server`(56M) + `backend/monitoring_demo`(46M) = 102MB 入库。本次 `monitoring_demo` 已从 ls-files 消失（✅ 已清理），`server` 仍在（57MB）。说明清理工作进行了一半。

**影响**: 仓库 clone/pull 仍缓慢；`.git` 历史仍膨胀；每次重新编译产生 diff。

**修复**:
```bash
git rm --cached backend/server
git commit -m "chore: remove committed binary backend/server"
# 历史清理（可选，需团队协调）：git filter-repo --path backend/server --invert-paths
```

---

## 📁 上轮 BLOCKER 修复跟踪

| 上轮编号 | 问题 | 本次实测状态 |
|---------|------|-------------|
| B1 (SEC-1-01) | CSRF 三重失效 | 待 R1 复核 |
| B2 (CONTRACT-1-01) | 文章写操作 id vs slug | 待 R2 复核 |
| B3 (CONTRACT-1-02) | DTO snake_case vs camelCase | 待 R2 复核 |
| B4 (CONTRACT-1-03) | 列表返回全文 + 详情无 author/tags | ⚠️ **代码已修（Preload/Omit），但测试回归（B-0-2）** |
| B5 (QUAL-3-01) | handlers 测试编译失败 | ✅ 已修（handlers 覆盖率 66.4%，测试 PASS） |
| B6 (QUAL-3-01) | cmd/server 测试 panic | ✅ 已修（cmd/server 测试 PASS，覆盖率 0% 但不 panic） |
| INFRA-5-01 | 二进制入库 | 🟡 **半修**（.gitignore 补全，但 server 未 git rm）→ B-0-3 |
| INFRA-5-02 | 后端无 CI | ✅ 已修（`backend-ci.yml` 已新增，但 `go build ./...` 会因 B-0-1 失败） |
| INFRA-5-05 | 000003 编号冲突 | ❌ **未修**（仍有两个 000003） |

---

## ✅ 基线确认的改善点

1. **前端 1:1 复刻完成且可构建**：21 路由全部成功 `pnpm build`，TypeScript 零类型错误。
2. **handlers / cmd/server 测试可运行**：上轮两大 BLOCKER（B5/B6）已修复。
3. **后端 CI 已建立**：`backend-ci.yml` 已存在（待验证内容）。
4. **二进制清理进行中**：`monitoring_demo` 已移除，`server` 待移除。
5. **`.gitignore` 规则补全**：覆盖了上一轮指出的所有遗漏类型。

---

## 🧭 基线结论

本轮 1:1 复刻是**前端的重大进展**（代码翻倍、构建通过、21 路由齐全），但**后端出现新的回归**：

1. **`go build ./...` 仍失败**（B-0-1，examples 包非法 main 声明）——上轮就存在，未修。
2. **`go test ./...` 新增回归**（B-0-2，B4 修复未同步测试 → postgres 包 6 项红）——这是"修复引入回归"的典型。
3. **二进制清理未完成**（B-0-3）。

**核心矛盾**：上一轮审计明确建议"先让测试可运行，作为后续修复的安全网"，但本轮的 B4 修复恰恰在**测试红着的情况下改了业务代码**，直接导致测试套件无法验证修复正确性。**测试基础设施的脆弱性是当前最大系统性风险。**

后续 5 轮将深入：安全（R1）、契约（R2）、后端质量（R3）、前端质量（R4）、工程化（R5），并重点复核上轮 32 个问题的真实修复状态。
