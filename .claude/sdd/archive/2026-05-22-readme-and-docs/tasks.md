# tasks.md — readme-and-docs

> 阶段前缀 `[DOC]`
> 几乎全 NO-TDD（commit 必须带 `[no-tdd]`），仅 sanity test 例外。
> commit scopes: `docs-sanity` / `readme` / `architecture` / `deployment` / `development` / `conventions` / `license`

## §0 准备

- [ ] 读 SDD 全套 + master / handoff-guide / known-findings
- [ ] 读 CLAUDE.md 全文（README/docs 的主要内容源）
- [ ] 读 memory-bank/ 全部（补充上下文）
- [ ] 确认 ha1den 同意 MIT license（默认认为同意，handoff 提醒）

## §A [DOC] README + sanity test (SPEC-DOC-R-1..4)

### A.1 [TEST-RED]
- 新建 `tests/docs-sanity.test.ts`
- 跑 → FAIL（README 还是 boilerplate）
- commit: `test(docs-sanity): SPEC-DOC-R-4 README boilerplate sanity check`

### A.1 [IMPL-GREEN]
- 重写 `/README.md`（按 design-notes 完整骨架）
- 跑 sanity test → PASS
- commit: `chore(readme): SPEC-DOC-R-1..4 rewrite README — TZBlog identity + quickstart + stack [no-tdd]`

## §B [DOC] docs/ 文件 (NO-TDD)

### B.1 architecture
- 新建 `docs/architecture.md`，按 SPEC-DOC-D-1
- commit: `docs(architecture): SPEC-DOC-D-1 architecture overview [no-tdd]`

### B.2 deployment
- 新建 `docs/deployment.md`，按 SPEC-DOC-D-2
- commit: `docs(deployment): SPEC-DOC-D-2 self-hosted deployment guide [no-tdd]`

### B.3 development
- 新建 `docs/development.md`，按 SPEC-DOC-D-3
- commit: `docs(development): SPEC-DOC-D-3 local development guide [no-tdd]`

### B.4 conventions
- 新建 `docs/conventions.md`，按 SPEC-DOC-D-4
- commit: `docs(conventions): SPEC-DOC-D-4 commit + TDD + SDD conventions [no-tdd]`

## §C [DOC] LICENSE

### C.1 MIT
- 新建 `/LICENSE`（MIT，年份 2026，author "ha1den"）
- commit: `chore(license): add MIT LICENSE [no-tdd]`

## §D 验收

- [ ] `pnpm typecheck && pnpm lint && pnpm test && pnpm build`
- [ ] sanity test 通过
- [ ] review checklist (test-map.md 末)
- [ ] git log 复核 7 commits（1 test + 1 README + 4 docs + 1 LICENSE）
- [ ] husky hook 全部通过（no-tdd 白名单：所有 staged 文件 ∈ {*.md, /LICENSE, tests/docs-sanity.test.ts}）
- [ ] completion-report.md

## §E 不归档

## ⚠️ 关键 commit-msg hook 注意

- 所有 `[no-tdd]` commit 的 staged files 必须在 husky 白名单（*.md / LICENSE / *.css）
- `chore(readme)` 改了 README.md → OK
- `docs(architecture)` 改了 docs/architecture.md → OK
- `chore(license)` 加 /LICENSE → 看 husky hook 是否接受 LICENSE 文件
  - 如果不接受，handoff 提醒手动 review husky 配置 OR 改 commit message scope
