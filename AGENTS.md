# AGENTS.md — TZBlog

> 本文件是 Codex 的项目级指令。Claude Code 继续使用 `CLAUDE.md`；两端共享 `memory-bank/` 与 `.claude/sdd/`。

## 核心上下文（每次会话优先读取）

- `memory-bank/projectBrief.md`
- `memory-bank/techContext.md`
- `memory-bank/systemPatterns.md`
- `memory-bank/progress.md`
- `memory-bank/knownIssues.md`

## 项目概述

TZBlog 是一个自研的个人技术博客系统。单体 Next.js 16 应用，包含前台展示 + 后台 CMS + 自研 Analytics，部署在自有 VPS（Docker Compose + Caddy）。

## 技术栈

- **框架**：Next.js 16 (App Router / RSC / Server Actions)
- **语言**：TypeScript 5 (strict)
- **数据库**：PostgreSQL 16 + Prisma 7
- **UI**：shadcn/ui + Tailwind CSS v4（CSS 变量驱动主题）
- **编辑器**：Markdown source editor + split preview（存储格式为 Markdown；编辑层仍依赖 Tiptap v3 + tiptap-markdown）
- **MD 渲染**：remark + rehype + Shiki
- **认证**：Auth.js v5 (Credentials provider)
- **媒体**：MinIO (S3 协议，自部署)
- **部署**：Docker Compose + Caddy (自动 HTTPS) + VPS

## 开发命令

```bash
pnpm dev              # 启动开发服务器 (turbo)
pnpm build            # prisma generate && next build
pnpm lint             # next lint
pnpm typecheck        # tsc --noEmit
pnpm test             # vitest run
pnpm db:migrate       # prisma migrate dev
pnpm db:seed          # tsx prisma/seed.ts
pnpm docker:dev       # 启动本地 Postgres + MinIO 容器
```

## 架构规则

### 路由组织

- `src/app/(site)/` — 前台公开页面，无认证
- `src/app/(admin)/` — 后台管理，proxy 守卫
- `src/app/api/` — REST API
- `src/proxy.ts` — 守 `/admin/*` 和 `/api/admin/*`

### 数据访问

- Server Component 直接 `await db.post.findMany(...)`，不包装无意义 service 层
- 只有跨多表业务流程才拆 `src/lib/services/*.ts`
- 不写 Repository 模式

### API 响应格式

```
成功：{ "data": <T>, "meta": {...} }
失败：{ "error": { "code": "...", "message": "...", "details": {...} } }
```

### 表单 & 校验

- zod schema 写一份，前后端共享（`src/lib/schemas/*.ts`）
- 前端 react-hook-form + @hookform/resolvers/zod
- 后端 API 入口必须 zod.parse(body)

### 主题变量

- 所有颜色必须用 CSS 变量：`color: hsl(var(--fg))`，**禁止**硬编码色值
- 变量定义在 `src/styles/globals.css` 的 `@theme` 块
- 命名：`--bg / --fg / --muted / --accent / --border / --ring` 等语义化

### i18n

- 内容字段抽到 `*Translation` 子表，按 `(parentId, locale)` 唯一
- 查询时 `where: { locale: currentLocale }`
- MVP 写死 "zh"，V3 从 URL 解析

### 计数器

- Post 内嵌 `viewCount / likeCount / commentCount`
- 写入时事务内 `count = count + 1`
- 详情表（PostView / PostLike / Comment）记录原始数据用于去重

### 反垃圾

- `visitorHash = sha256(ip + userAgent + dailySalt)`
- 浏览去重：同访客 + 同文章 + 同天 = 一次
- 点赞：同访客 + 同文章 永久 unique（一次）
- 评论：同 visitorHash 5 分钟内最多 3 条

## 编码规范

- 组件文件 PascalCase：`PostCard.tsx`
- 普通文件 camelCase：`useDebounce.ts`
- 测试文件 `*.test.ts` 与被测文件同目录
- 不要 `try/catch + console.error + 返回空值` 吞错（silent failure 禁忌）
- 业务异常用 `AppError`（`src/lib/errors.ts`）

## Git 规范

- Conventional Commits 带 scope：`feat(<scope>):` / `fix(<scope>):` / `test(<scope>):` / `refactor(<scope>):` / `chore:` / `docs:`
- TDD 节奏（每个微循环两提交，scope 一致）：
  - `test(<scope>): <spec-id>` ← 此时测试 RED
  - `feat(<scope>): <spec-id>` ← 此时测试 GREEN
  - `refactor(<scope>): <desc>` ← 可选，不改测试
- 一个 SDD feature 一组 commit，不混 feature
- **husky commit-msg hook** 自动检查：未带 `[no-tdd]` 的 feat: 必须在前 5 个 commit 找到同 scope 的 test:，否则拒绝提交

<!-- WORKFLOW-START: scenario-0-explore v3.1.1 -->
## Scenario 0: Explore Gate

When the request is vague, do not force it into implementation. Offer explore mode first.

### Vague Signals

| Category | Signals |
|----------|---------|
| Early idea | 想做, 考虑, 我在想, 可能, 也许 |
| No clear path | 怎么搞, 从哪开始, 还没想好, 大概, 思路 |
| New direction | 新项目, 新工具, 从零, 未来怎么 |
| Tradeoff | X 还是 Y, 哪个好, 对比一下, 选哪个 |
| Vague bug | 奇怪, 莫名, 找不到规律, 偶尔, 有时候 |

### Explore Rules

1. Start each explore response with `[EXPLORE]`.
2. Do not write application code, install dependencies, or modify source files.
3. You may read files, search the codebase, draw diagrams, and create or update SDD artifacts.
4. SDD artifacts must go under `.claude/sdd/`.

### Convergence

When the user says "开始吧", "OK 就这样", "let's do it", or two turns add no new information, output:

```markdown
## What We Figured Out

**The problem**: <one sentence>
**The approach**: <direction + key decisions>
**Open questions**: <unresolved items>
**Risks**: <identified risks + mitigations>
**Capture plan**: <artifacts to write>

**Next**:
- [A] Capture -> enter requirement alignment
- [C] Capture to `.claude/sdd/` as reference only
- [D] Do not capture, end explore
```

### Auto-Capture

| Choice | Action |
|--------|--------|
| [A] | Create `.claude/sdd/<feature>/`, write `proposal.md` and `design-notes.md`, do not write specs yet. |
| [C] | Append notes under `.claude/sdd/` or update `memory-bank/progress.md`. |
| [D] | End explore without writing artifacts. |

Every auto-captured file must end with:

```html
<!-- Draft auto-generated from explore. Review before use. Generated: <ISO-timestamp> -->
```
<!-- WORKFLOW-END: scenario-0-explore -->

<!-- WORKFLOW-START: analysis-handoff v3.1.1 -->
## Analysis Handoff

Any analysis or investigation task must end with conclusions and a next-step handoff. Do not silently stop after analysis.

### Requirement Analysis

Trigger examples: "分析一下", "评估", "调研", "帮我想想", "看看这个功能怎么做".

Output these parts:

1. Technical approach, including tradeoffs.
2. Impact scope, with affected files/modules/interfaces when known.
3. Risks, including unknowns that need verification.
4. Effort estimate: lightweight or deep, with rough time.

End with:

```markdown
Analysis complete. How to proceed?
- [A] Enter requirement alignment + TDD (recommended)
- [B] Skip alignment, go straight to TDD
- [C] Analysis only, stop here
```

If the user chooses [A], create or continue `.claude/sdd/<feature>/` and follow `/sdd-new-feature`.
If the user chooses [B], begin research and TDD, but still obey test-map and RED/GREEN evidence rules unless this is a documented NO-TDD exception.
If the user chooses [C], record durable conclusions in `memory-bank/progress.md` when appropriate.

### Bug Triage

Use hypothesis-driven debugging:

1. Build a hypothesis table.
2. Reproduce or identify the smallest failing path.
3. Check recent changes, similar entry points, environment differences, and relevant call sites.

Split by impact:

| Impact | Route |
|--------|-------|
| Lightweight bug | Single file, style-only, or obvious small fix. Offer direct fix. |
| Deep bug | Cross-file, interface, state, permission, DB, or core path. Use full regression-test RED -> GREEN flow. |

After fixing a bug:

1. Re-run the original path.
2. Update `memory-bank/knownIssues.md`.
3. Update `memory-bank/progress.md`.
4. Evaluate whether `memory-bank/systemPatterns.md` needs a prevention rule.

If two hypotheses fail, escalate to explore mode and build a hypothesis map.

### Unclear Intent

If the user says "帮我看看", "怎么样", or similar, ask whether they want analysis only, analysis then fix, or direct fix before acting.
<!-- WORKFLOW-END: analysis-handoff -->

<!-- WORKFLOW-START: tdd-ironrules v3.1.1 -->
## SDD + TDD Iron Rules

This is the Codex adapter for the workflow-template SDD layer. Claude Code and Codex share the same project artifacts.

### SDD Artifact Directory

Use this path for all feature artifacts:

```text
.claude/sdd/<feature>/
├── proposal.md
├── design-notes.md
├── specs/
│   └── <capability>/spec.md
└── test-map.md
```

Do not create `.sdd/` in projects initialized by this workflow.

### Spec Format

Each scenario needs a stable kebab-case spec-id:

```markdown
### SCENARIO: auth-session-001

**GIVEN** a valid refresh token
**WHEN** the session refresh endpoint is called
**THEN** a new access token is returned
```

### Test-Map Gate

`.claude/sdd/<feature>/test-map.md` must exist before implementation tasks:

```markdown
| Spec-ID | Test Layer | Test File | Test Function | Notes |
|---------|-----------|-----------|---------------|-------|
| auth-session-001 | unit | src/auth.test.ts | refreshTokenSuccess | |
```

No test-map means no task generation.

### Micro-Cycle Structure

Tasks must be one spec per RED/GREEN cycle:

```text
1. <module-name>
  1.1.a [TEST-RED] write failing test for <spec-id>
  1.1.b [IMPL-GREEN] implement the minimum code for <spec-id>
```

Rules:

1. Every [IMPL-GREEN] requires a preceding [TEST-RED].
2. Do not batch all tests at the end.
3. Each micro-cycle should stay under 30 minutes.
4. RED must include real terminal output with `FAIL` or `FAILED`.
5. GREEN must include real PASS output.

### Commit Rhythm

Each micro-cycle uses two commits:

```text
test(<scope>): <spec-id>
feat(<scope>): <spec-id>
```

The commit-msg hook enforces that a `feat:` commit without `[no-tdd]` has a matching same-scope `test:` commit in the last five commits.

### NO-TDD Exceptions

Allowed only for:

1. Pure CSS/style changes with no interaction change.
2. Documentation and SDD metadata files.

The commit message must include `[no-tdd]`. Refactoring, config changes, dependency changes, and behavior changes are not NO-TDD.
<!-- WORKFLOW-END: tdd-ironrules -->

<!-- WORKFLOW-START: flow-diagram v3.1.1 -->
## Development Flow

This is the project-level Codex flow. It mirrors the Claude Code workflow while using Codex-native prompts.

```text
User input
  |
  |-- vague idea --> explore gate --> /sdd-explore --> capture
  |-- clear feature --> analysis handoff --> /sdd-new-feature
  |-- bug --> hypothesis triage --> lightweight fix or TDD regression
  |-- unclear intent --> classify before action
                          |
                          v
              requirements -> specs -> test-map
                          |
                          v
              implementation plan with micro-cycles
                          |
                          v
              [TEST-RED] FAIL -> commit test(...)
                          |
                          v
              [IMPL-GREEN] PASS -> commit feat(...)
                          |
                          v
              /sdd-finish -> quality gate -> memory-bank update
```

### Required Commands

| Task | Codex Prompt |
|------|--------------|
| Initialize project workflow | `/init-project` |
| Sync workflow templates | `/sync-workflow` |
| Explore vague problem | `/sdd-explore` |
| Start feature | `/sdd-new-feature` |
| Finish feature | `/sdd-finish` |
| Update project context | `/sdd-update-context` |

### Durable State

| State | Path |
|-------|------|
| Project goals and constraints | `memory-bank/projectBrief.md` |
| Tech stack and environment | `memory-bank/techContext.md` |
| Architecture decisions and patterns | `memory-bank/systemPatterns.md` |
| Current focus and milestones | `memory-bank/progress.md` |
| Known issues and bug history | `memory-bank/knownIssues.md` |
| Feature SDD artifacts | `.claude/sdd/<feature>/` |

After any completed task, update `memory-bank/progress.md`. After a bug fix, also update `memory-bank/knownIssues.md` and evaluate `systemPatterns.md`.
<!-- WORKFLOW-END: flow-diagram -->

## Codex 工作流入口

本项目用 **SDD（Spec-Driven Development）** 管理功能变更，Claude Code 与 Codex 共享 artifact 路径：

- `.claude/sdd/<feature>/` — active SDD（proposal / specs / test-map / design-notes）
- `.claude/sdd/archive/<date>-<feature>/` — 已归档 SDD（如项目使用归档）

### Codex 命令

- `/sdd-explore` — 模糊需求探索
- `/sdd-new-feature` — 开始新功能完整流程
- `/sdd-finish` — 收尾当前功能（质量门 + memory-bank 同步）
- `/sdd-update-context` — 更新 memory-bank 上下文
- `/sync-workflow` — 从 workflow-template 同步 Codex marker 段

### Claude 兼容

- Claude Code 继续使用 `CLAUDE.md` 和 `.claude/commands/*`。
- Codex 不创建 `.sdd/`，避免和 Claude 的 `.claude/sdd/` 分叉。
- `memory-bank/activeContext.md` 是历史文件；Codex 持久进度以 `memory-bank/progress.md` 为准。
