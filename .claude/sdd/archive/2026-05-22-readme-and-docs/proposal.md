# Proposal — readme-and-docs

> Stage: Pre-deploy P2 cleanup
> Created: 2026-05-22
> Path: `.claude/sdd/readme-and-docs/`
> Tier: T2 / 0.5 day
> **NO-TDD** feature（仅 *.md / *.css 文件；commit 必须带 `[no-tdd]` 标签）

## Why

`README.md` 当前是 create-next-app 默认 boilerplate ("This is a Next.js project bootstrapped with..."). 项目已自定到完全不同的形态（自研 CMS / Analytics / MinIO / Docker / Caddy）。需要重写 README 让访问 repo 的人 30 秒理解：
- 这是什么（TZBlog，个人技术博客）
- 技术栈
- 怎么 setup local
- 怎么 deploy
- 重要约定（SDD / TDD 节奏）

同时缺 `docs/` 目录：
- `docs/architecture.md` — 路由 / 数据 / auth 概览
- `docs/deployment.md` — Docker Compose + Caddy 步骤
- `docs/development.md` — local 开发详细
- `docs/conventions.md` — commit / SDD / TDD 节奏

不修这层：repo 看起来是半成品 boilerplate；新 contributor (or future ha1den 回头) 无 onboarding。

## What

### Capability: README rewrite
- 完整重写 `/README.md`
- 结构：
  1. Project tagline + screenshot placeholder
  2. Stack table
  3. Quickstart (5 命令)
  4. Project structure (top-level dirs)
  5. Conventions (commit / TDD / SDD / no-tdd 例外)
  6. Deployment overview (link to docs/deployment.md)
  7. License / Author

### Capability: docs/ creation
- 新建 `docs/`
  - `docs/architecture.md` — 路由组、数据访问、auth、theme variables、i18n、计数器、反垃圾
  - `docs/deployment.md` — Docker Compose、Caddy、env、backup、监控
  - `docs/development.md` — local setup、docker:dev、prisma migrate、test、editor、MinIO local console
  - `docs/conventions.md` — commit format、TDD 节奏、SDD 流程、husky hook、no-tdd 例外

### Capability: 内容来源
- 直接从 `CLAUDE.md` + `memory-bank/` 提炼（已有完整 spec），转人类友好语气

### 不在范围
- 多语言 README
- 加 badges (CI / coverage) — 上线后再说
- 接 docusaurus
- API reference docs (next 增量)
- video tutorials
- screenshots（占位即可，ha1den 上线后补真图）

## Decisions

| # | 矛盾 / 备选 | 决策 | Reason |
|---|---|---|---|
| R1 | README 单文件 vs README + docs/ | **README + docs/** | README 简，详细在 docs/ |
| R2 | docs 用 docusaurus vs 纯 md | **纯 md** | 零依赖；GitHub 直接渲染 |
| R3 | README 语言 | **中文为主 + 关键 commands 英文** | ha1den 中文用户；保留 cli 可复制 |
| R4 | docs 语言 | **中文** | 一致 |
| R5 | screenshot 处理 | **占位 + TODO 注释** | ha1den 上线后补 |
| R6 | LICENSE | **MIT** | 默认开源 |
| R7 | TDD 例外 | **NO-TDD**（全是 *.md） | commit 必须带 `[no-tdd]` |
| R8 | 是否检测 README boilerplate stays | **加 1 个 sanity check test** | 防回滚（ts test 验 README 不再含 "create-next-app"）|

## Capabilities 摘要

| capability | spec 文件 | spec-id 范围 |
|---|---|---|
| README | `specs/readme/spec.md` | SPEC-DOC-R-1..4 |
| docs | `specs/docs/spec.md` | SPEC-DOC-D-1..4 |

> 注：spec 不是 GIVEN/WHEN/THEN 行为 spec，是"该 md 必须包含某些段落 / 标题"的 content spec。
> 仅 SPEC-DOC-R-4（sanity check）是有 TypeScript 测试代码的 spec。

## Impact

- 修改：
  - `/README.md`（完整重写）
- 新增：
  - `/docs/architecture.md`
  - `/docs/deployment.md`
  - `/docs/development.md`
  - `/docs/conventions.md`
  - `/LICENSE`（MIT）
  - `/tests/docs-sanity.test.ts`（验 README 不含 boilerplate 字串）
- 依赖：无新装

## Workflow

1. SDD 8 件套
2. **§A README**（写 + sanity test）
3. **§B docs/** 4 文件依次写
4. **§C LICENSE**
5. 质量门 + completion-report

**所有 commit 必须带 `[no-tdd]`**（NO-TDD 例外），但 SPEC-DOC-R-4 的 sanity test 是 `*.test.ts` 文件，需要单独 TDD pair（一次 test + 一次 feat），避开 NO-TDD 限制。

## Commit 节奏 plan

```
# §A README + sanity test (TDD pair, scope=docs-sanity)
test(docs-sanity): SPEC-DOC-R-4 README boilerplate sanity check
chore(readme): SPEC-DOC-R-1..3 + SPEC-DOC-R-4 GREEN rewrite README [no-tdd]  
  ← 注意此处仍带 [no-tdd] 因 chore 不是 feat (hook 只 enforce feat)

# §B docs/ (NO-TDD, 1 commit per file)
docs(architecture): SPEC-DOC-D-1 architecture overview [no-tdd]
docs(deployment): SPEC-DOC-D-2 deployment guide [no-tdd]
docs(development): SPEC-DOC-D-3 development guide [no-tdd]
docs(conventions): SPEC-DOC-D-4 commit / TDD / SDD conventions [no-tdd]

# §C LICENSE
chore(license): MIT license [no-tdd]
```

**等等 — husky hook 详查**：CLAUDE.md 说 "未带 `[no-tdd]` 的 `feat:` 必须在前 5 个 commit 找到同 scope 的 `test:`，否则拒绝提交"。`chore` / `docs` / `test` 不在 enforce 范围内（hook 只检 feat:）。

所以：
- README 用 `chore(readme): ... [no-tdd]` （chore 不被 hook 强制，加 [no-tdd] 显式标注例外）
- sanity test commit 用 `test(docs-sanity): ...` （test type，不被 hook 检查）
- impl 用 `chore(docs-sanity): ... [no-tdd]` （`feat(...)` 会触发 hook 检 test：但前一个 commit 是 test(docs-sanity)，所以也可以走 feat；为安全用 chore + [no-tdd]）

## Risks

| 风险 | 缓解 |
|------|------|
| README 太长，重要信息埋没 | 严格 5 段；详细 → docs/ |
| docs/ 文档随代码漂移 | 在每篇顶端加 `> Last verified: 2026-05-22` 时间戳；ha1den 季度 review |
| MIT license 假定 | 在 handoff 验 ha1den 同意 |
| screenshot 占位丑 | placeholder 加 `<!-- TODO[post-launch]: replace -->` |
| sanity test 误判 | 限定 `expect(readme).not.toContain("bootstrapped with [`create-next-app`]")` 仅原 boilerplate 字串 |
