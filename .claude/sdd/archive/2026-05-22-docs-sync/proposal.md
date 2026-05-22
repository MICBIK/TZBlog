# Proposal — docs-sync

> Stage: Pre-deploy housekeeping
> Created: 2026-05-22
> Path: `.claude/sdd/docs-sync/`
> Tier: T2 / 10 min implementation

## Why

R1（comments-and-likes SDD 决策）+ R6（admin-comments-review SDD 决策）已经在代码层落地，但是文档没跟上：

1. **`memory-bank/progress.md`** 的 P2 段有几个 checkbox 实际上已经完成但仍标记未完成。读这份 progress 的下一位（人 / AI）会以为还有工作没做，浪费时间二次确认。
2. **`CLAUDE.md`** 第 84 行描述了"点赞 24h 滚动"的旧约束，但 R1 决策已经把它改成"永久 unique"（`prisma/schema.prisma:210` 的 `@@unique([postId, visitorHash])` 已证明）。下一位读 CLAUDE.md 的开发会按错误描述行事。

不修这层，"docs vs reality"的偏离会越来越大，最终某次 review/audit 会爆炸。

## What

两个 capability（每个独立，无依赖）：

### Capability: checkbox-sync
- 把 `memory-bank/progress.md:142` 的 `[ ] 文章详情（Shiki + TOC + 浏览上报 + 点赞 + 评论区）` 改为 `[x]`，附 archive 引用
- 把 `memory-bank/progress.md:145` 的 `[ ] 自研 Analytics 客户端上报（<AnalyticsBeacon>）` 改为 `[x]`，附 archive 引用
- **不**勾未实际完成的项（如第 141 行 Hero、第 143 行 tags-pages 等 — 这些是 Batch 1/2 SDD 的工作）

### Capability: claude-md-sync
- 把 `CLAUDE.md:84` 的 `- 点赞：同访客 + 同文章 24h 内一次` 改为 `- 点赞：同访客 + 同文章 永久 unique（一次）`
- 不动其他行（grep 已确认 CLAUDE.md 中无 "PENDING" / "commentCount 计 PENDING" 字符串，R6 在 CLAUDE.md 无对应 stale）

### 不在 docs-sync 范围
- 不重写 `memory-bank/activeContext.md`（活跃文档，每次 session 由 `/project:update-context` 自然更新）
- 不重写 `knownIssues.md`（除非 grep 发现 stale，需 stop+report）
- 不改 `memory-bank/systemPatterns.md`（R1/R6 不涉及架构）
- 不改 archive 目录任何文件（archive 是时间快照，不应动）

## Decisions

| # | 矛盾 / 备选 | 决策 | Reason |
|---|---|---|---|
| R1 | 单 commit 包两个 area vs 两个独立 commit | **两个独立 commit**：`docs(memory-bank): ...` + `docs(claude-md): ...` | 历史更清晰；将来 git log 一眼看出哪个 area 被改 |
| R2 | grep 发现 MORE stale 项时如何处理 | **stop + report**：不擅自扩大 scope；输出新发现给 ha1den，等指示 | YAGNI；range 边界守住，避免误改未识别的 stale |
| R3 | `[no-tdd]` 标签是否安全 | **安全**：staged 文件仅 `.md`，hook 白名单已覆盖（`.md/.mdx/.txt/.rst` 在白名单内） | hook 二次验证，避免误用 |
| R4 | progress.md 142 行勾选时是否附加 archive 引用 | **附加** archive 引用 `（archive/2026-05-21-{name}/）` | 一行修改提供 audit trail |

## Capabilities 摘要

| capability | spec 文件 | spec-id 范围 |
|---|---|---|
| checkbox-sync | `specs/checkbox-sync/spec.md` | SPEC-DS-CB-1..2 |
| claude-md-sync | `specs/claude-md-sync/spec.md` | SPEC-DS-MD-1 |

## Impact

- 修改：`memory-bank/progress.md`（2 行）/ `CLAUDE.md`（1 行）
- 新增：无
- 依赖：无
- DB 迁移：无
- 测试新增：无（grep 验证不是 vitest 单元测试）

## Out of scope

- activeContext.md 同步（按上面 What 段说明 — 自然更新）
- knownIssues.md 全文 audit（若 grep 发现额外 stale 触发 R2）
- systemPatterns.md 增补 R1/R6 教训（不在本任务范围；R1/R6 已在各自 SDD archive 充分记录）
- README.md / docs/ 同步（属于 readme-and-docs SDD 范围）
- 任何 CLAUDE.md 段落级重写（仅 line-level fix）

## Workflow

1. `proposal + 2×spec + test-map + tasks + design-notes + handoff` 一次性建好（如本次本 commit 完成）
2. 按 tasks.md 执行：每条 spec 走 `[GREP-VERIFY-BEFORE]` → `[EDIT-APPLY]` → `[GREP-VERIFY-AFTER]` 三步
3. 两个独立 commit：
   - `docs(memory-bank): sync stale P2 checkboxes for D2/D3/analytics-beacon [no-tdd]`
   - `docs(claude-md): sync R1 point-likes permanent-unique line [no-tdd]`
4. **不**走 `/project:finish-feature`（任务太轻；交给后续 claude 审计阶段统一归档）

## Risks

| 风险 | 缓解 |
|------|------|
| 实施 AI 误勾未完成的 P2 项（如 Hero） | tasks.md 显式列出"勾哪两行"，禁止扩大 |
| 实施 AI 改 archive 文件 | tasks.md 显式禁止 |
| `[no-tdd]` 与 non-.md 文件混在一起触发 hook 拒绝 | tasks.md 强调 `git add` 仅 stage 两个 target 文件 |
| grep 发现额外 stale 但实施 AI 自作主张改了 | R2 决策"stop+report"，handoff.md 强调 |
