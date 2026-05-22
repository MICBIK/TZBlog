# Handoff Guide — 给接收 AI 的使用说明

> 你（接收 AI）正在拿到 TZBlog 项目的部署前 10 项任务。这份文档说明如何正确执行。

## 前置阅读（必须，按顺序）

1. **`master.md`**（已读完？没读完就停下来读完）— 项目背景 + 技术栈 + 编码约束 + TDD 工作流
2. **`execution-plan.md`** — 执行顺序与依赖关系
3. **目标 SDD 的 `handoff.md`** — 当前任务的入口提示词
4. **目标 SDD 的 `proposal.md`** — 任务的 Intent / Scope / Approach / Risks
5. **目标 SDD 的 `specs/*/spec.md`** — GIVEN/WHEN/THEN 验收用例
6. **目标 SDD 的 `test-map.md`** — spec-id → 测试函数映射
7. **目标 SDD 的 `tasks.md`** — 微循环任务清单（这是你的执行清单）
8. **目标 SDD 的 `design-notes.md`** — 设计决策记录

## 工作流（强制）

每个 SDD 的 tasks.md 含若干微循环，按编号顺序执行。每个微循环走 RED → GREEN 闭环：

### RED 阶段（写测试）

1. 读 `tasks.md` 的当前 `x.y.a [TEST-RED]` 任务
2. 找到对应 spec-id 的 spec 内容
3. 找到 `test-map.md` 指定的测试文件路径
4. 写测试 — 测试函数名必须与 test-map 一致
5. 跑测试：`pnpm vitest run <test-file-path>`
6. **必须**看到真实 FAIL 输出（PASS 视为 RED 失败 — 你写错了测试或测试没覆盖到）
7. 把 FAIL 输出粘到任务进度里（如果有 progress tracker）
8. `git add <test-file>`
9. `git commit -m "test(<scope>): <spec-id> <一句话描述>"`

### GREEN 阶段（写实现）

1. 读 `tasks.md` 的当前 `x.y.b [IMPL-GREEN]` 任务
2. 写最小实现，让上一步测试 PASS
3. 跑测试：`pnpm vitest run <test-file-path>`
4. **必须**看到真实 PASS 输出
5. 跑全套：`pnpm typecheck && pnpm lint`（必须绿）
6. `git add <impl-files>`
7. `git commit -m "feat(<scope>): <spec-id> <一句话描述>"`

### REFACTOR 阶段（可选）

仅当代码可读性 / 重复度可改进时。**不**改测试。
`git commit -m "refactor(<scope>): <一句话描述>"`

## 禁止事项（违反会被审计阶段打回）

| 禁止 | 为什么 |
|------|-------|
| 跳 `[TEST-RED]` 直接写实现 | 破坏 TDD 节奏，commit-msg hook 会拒绝 `feat(<scope>)` |
| 声明式 RED（不跑测试就 commit） | 无证 RED 视为伪 RED |
| 用 `[no-tdd]` 跳过 TDD 节奏 | hook 只放行白名单文件（`*.md/*.css` 等）；混合提交会拒 |
| `--no-verify` 跳 hook | 直接违反 CLAUDE.md 的"破坏性操作分级确认"规则 |
| `try/catch + 返回空值` 吞错 | silent failure 禁忌；改用 `AppError` from `src/lib/errors.ts` |
| 硬编码色值（`#fff` / `bg-red-500` 等） | 必须用 CSS 变量（`hsl(var(--bg))` / `text-fg` 等） |
| 大文件（>800 行） | hook 拦截 Write 工具，必须拆模块 |
| 删除/修改 Prisma schema 未确认 | DB 改动必须先报 ha1den；本批 10 任务**无需**改 schema |
| 装未声明的依赖 | 每个 SDD 列了所需依赖；额外依赖需在 design-notes 申报 |
| 修改 `.husky/commit-msg` 或 `CLAUDE.md` 绕过约束 | 这些是审计 baseline，不可改 |
| 修改未提到的文件 | 只动 SDD 提到的文件路径；其他文件视为禁区 |

## 当你卡住时

### 测试 PASS 但你没改实现

- 看测试是否真的覆盖到新行为
- 检查 mock 是否劫持了你想测的代码路径

### 测试 FAIL 但你确定实现对

- 看 mock 是否 stale（`beforeEach` 重置）
- 看 Prisma 数据是否需要 reset（DB 测试用 truncate）
- jsdom 缺 polyfill（Radix 组件常见）→ 在 `vitest.setup.ts` 加 polyfill

### 类型错误难修

- 看 `src/lib/services/*.ts` 现有类型用法
- 用 `unknown` + narrow，禁用 `any`
- React props 用 `interface`，联合用 `type`

### Lint 报错

- 不要用 `eslint-disable` 全文件级别
- 行级 `eslint-disable-next-line` 只在 `<img>` 替代 `next/image` 这种已有项目共识下用
- 报错信息搜 progress.md / knownIssues.md 看是否已知

### 视觉效果不对（hero / about / tech-stack 任务）

- 看对应 SDD 的 `design-notes.md` 是否有 ASCII mockup
- 看 Tailwind v4 的 `@theme` 块是否有需要的变量
- 不确定字号 / 间距 → 走 `clamp()` 流体设计

## 完成 SDD 后

1. 跑全套：`pnpm typecheck && pnpm lint && pnpm test && pnpm build`
2. 在 SDD 目录加一个 `completion-report.md`：
   ```markdown
   # Completion Report — <SDD name>

   - Total commits: <n>
   - Test coverage: <new tests count>
   - Files changed: <list>
   - Manual smoke needed: <yes/no, 说明>
   - Outstanding concerns: <any unresolved questions>
   - Decisions made (not in design-notes): <any judgment calls>
   ```
3. **不**自动归档（archive 由 claude 审计阶段做）
4. **不**改 `memory-bank/*` 文件（claude 审计阶段统一更新）

## 全部 SDD 完成后

输出汇总：
```markdown
# Pre-Deploy Batch Completion

| SDD | Status | Commits | Tests added | Issues |
|-----|--------|---------|-------------|--------|
| docs-sync | ✓ | n | n | - |
| ...
```

并暂停，等 claude 审计。

## 与 ha1den 互动的边界

| 场景 | 该怎么做 |
|------|---------|
| 视觉方向有歧义（如 Editorial 字体选 Inter 还是 Source Serif） | 在 design-notes.md 写决策，不阻塞执行 |
| 需要 ha1den 提供素材（如 About 页 placeholder 要不要含真实链接） | **照 SDD 写的 placeholder 文案做**，不联系 ha1den |
| 发现 spec 与代码现状有冲突 | 在 design-notes.md 写"Conflict observed: ..."，按 spec 优先实现 |
| 测试 FAIL 反复无法 GREEN | 在 design-notes 写"Blocked: ..."，跳过该微循环继续下一个；最后汇总报告 |
| 想加 spec 里没有的功能 | **不要**。YAGNI。只做 SDD 范围内的事 |
| 想重构与本任务无关的现有代码 | **不要**。范围外改动会被审计阶段挑出来 |

## 审计阶段（claude 会做）

接收 AI 完成后，claude（审计 AI）会做：

1. **范围审计**：你改的文件是否都在 SDD 范围内
2. **测试审计**：每个 spec 是否有对应测试，测试是否真实跑过 RED
3. **代码审计**：CLAUDE.md 约束（命名 / 主题变量 / silent failure / 大文件 / 等）
4. **bug 排查**：跑端到端 smoke，看实际行为是否符合 spec
5. **修复**：发现的 bug 由 claude 直接修
6. **归档**：每个 SDD 通过审计后 `git mv` 到 archive
7. **memory-bank 同步**

你（接收 AI）的目标是把审计要返工的次数最小化。

## TL;DR

```
读 master.md → 读 execution-plan.md → 进入第一个 SDD →
读那个 SDD 的 handoff.md → proposal → specs → test-map → tasks →
按 tasks 顺序执行 RED → GREEN 微循环 →
跑质量门 → 写 completion-report.md → 进入下一个 SDD →
全部完成 → 输出汇总 → 等 claude 审计
```

收工。
