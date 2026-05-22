# tasks.md — docs-sync

> 微循环结构：1 spec = 1 微循环（3 子步骤）
> 阶段前缀 `[DS]`
> commit scope 约定：`memory-bank` / `claude-md`
> 所有 commit 加 `[no-tdd]` 标签（white-list 二次验证：staged 仅 `.md` 文件）

## §0 准备（一次性）

- [ ] §0.1 阅读以下文件，确认理解 R1 决策上下文：
  - `.claude/sdd/handoff-pre-deploy/master.md`
  - `.claude/sdd/handoff-pre-deploy/known-findings.md`（docs-sync 段）
  - `.claude/sdd/docs-sync/proposal.md`
  - `.claude/sdd/docs-sync/specs/checkbox-sync/spec.md`
  - `.claude/sdd/docs-sync/specs/claude-md-sync/spec.md`
  - `.claude/sdd/docs-sync/test-map.md`

- [ ] §0.2 **安全检查**（R2 fallback）：先跑一次 P2 段全局 grep：
  ```bash
  awk '/### P2 前台展示/,/### P3 部署上线/' memory-bank/progress.md | grep -nE "^- \[ \]"
  ```
  - **Expected**：5 行 unchecked (lines 141, 142, 143, 144 — 注：144 已是 `[x]`，应不在结果中；145 unchecked)。实际数应是 142, 143, 145 等。**仅 142 + 145** 是 100% shipped 的 stale。
  - 如果发现额外的 stale 行（非 142/145），按 R2 stop + report
  - 把 grep 结果存到 `.claude/sdd/docs-sync/grep-snapshot-before.md` 留档

## §A [DS] checkbox-sync

### A.1 [SPEC-DS-CB-1] 勾选"文章详情..."（line 142）

- [ ] A.1.a [GREP-VERIFY-BEFORE] 跑 `grep -n "文章详情（Shiki + TOC" memory-bank/progress.md`，确认 line 142 + `[ ]` 前缀
- [ ] A.1.b [EDIT-APPLY] Edit tool 把 line 142 从 `- [ ] 文章详情（Shiki + TOC + 浏览上报 + 点赞 + 评论区）` 改为 `- [x] 文章详情（Shiki + TOC + 浏览上报 + 点赞 + 评论区）—— D2 (TOC) + D3 (likes/comments) + analytics-beacon (page views) 已分别 archived`
- [ ] A.1.c [GREP-VERIFY-AFTER] 跑同 grep 命令，确认 line 142 + `[x]` 前缀 + archive 引用文本

### A.2 [SPEC-DS-CB-2] 勾选"自研 Analytics..."（line 145）

- [ ] A.2.a [GREP-VERIFY-BEFORE] 跑 `grep -n "自研 Analytics 客户端上报" memory-bank/progress.md`，确认 line 145 + `[ ]` 前缀
- [ ] A.2.b [EDIT-APPLY] Edit tool 把 line 145 从 `- [ ] 自研 Analytics 客户端上报（<AnalyticsBeacon>）` 改为 `- [x] 自研 Analytics 客户端上报（<AnalyticsBeacon>）—— archive/2026-05-21-analytics-beacon/`
- [ ] A.2.c [GREP-VERIFY-AFTER] 跑同 grep 命令，确认 line 145 + `[x]` 前缀 + archive 引用

### A.3 [Commit] 提交 memory-bank 同步

- [ ] A.3.a 跑 `git diff memory-bank/progress.md` — 确认仅 2 行变更
- [ ] A.3.b 跑 `git status --short` — 确认其他文件无意外变更
- [ ] A.3.c 跑 `git add memory-bank/progress.md`
- [ ] A.3.d 跑 `git diff --cached --name-only` — 确认 staged 仅 `memory-bank/progress.md`
- [ ] A.3.e 跑 commit：
  ```bash
  git commit -m "docs(memory-bank): sync stale P2 checkboxes for D2/D3/analytics-beacon [no-tdd]

  Lines 142 + 145 in progress.md were marked [ ] but the work shipped
  weeks ago (D2 TOC, D3 likes/comments, analytics-beacon page views).
  Flip to [x] with archive references for audit trail.

  No code changes; pure docs sync."
  ```
- [ ] A.3.f hook 输出应含 `✓ [no-tdd] 通过白名单文件校验`

## §B [DS] claude-md-sync

### B.1 [SPEC-DS-MD-1] 同步 R1 决策（点赞永久 unique）（line 84）

- [ ] B.1.a [GREP-VERIFY-BEFORE]：
  - `grep -n "24h" CLAUDE.md` — 确认 line 84 含 "24h 内一次"
  - `grep -n "永久 unique" CLAUDE.md` — 确认 0 hits
  - `grep -ni "PENDING\|commentCount 计 PENDING" CLAUDE.md` — 确认 0 hits（若有，R2 stop+report）
- [ ] B.1.b [EDIT-APPLY] Edit tool 把 line 84 从 `- 点赞：同访客 + 同文章 24h 内一次` 改为 `- 点赞：同访客 + 同文章 永久 unique（一次）`
- [ ] B.1.c [GREP-VERIFY-AFTER]：
  - `grep -n "24h" CLAUDE.md` — 0 hits 在 "点赞" context
  - `grep -n "永久 unique" CLAUDE.md` — ≥1 hit, line 84

### B.2 [Commit] 提交 claude-md 同步

- [ ] B.2.a 跑 `git diff CLAUDE.md` — 确认仅 1 行变更
- [ ] B.2.b 跑 `git status --short` — 确认其他文件无意外变更
- [ ] B.2.c 跑 `git add CLAUDE.md`
- [ ] B.2.d 跑 `git diff --cached --name-only` — 确认 staged 仅 `CLAUDE.md`
- [ ] B.2.e 跑 commit：
  ```bash
  git commit -m "docs(claude-md): sync R1 point-likes to permanent unique [no-tdd]

  Line 84 said '24h 内一次' but R1 decision (comments-and-likes SDD,
  archived) made point likes permanent unique. Prisma schema:210 has
  @@unique([postId, visitorHash]) with no time window — docs were
  lagging reality. Sync to '永久 unique（一次）'."
  ```
- [ ] B.2.f hook 输出应含 `✓ [no-tdd] 通过白名单文件校验`

## §C 验收（一次性）

- [ ] C.1 跑 `git log -3 --oneline`，确认有 2 个新 docs 提交
- [ ] C.2 跑 `git diff HEAD~2 --stat`，确认 stat 显示：
  - `CLAUDE.md | 2 +-` 左右
  - `memory-bank/progress.md | 2 +-` 左右（追加文本可能略增）
- [ ] C.3 不跑 `pnpm test` / `pnpm lint` / `pnpm typecheck` / `pnpm build`（无代码变更）
- [ ] C.4 写 completion-report.md 到 `.claude/sdd/docs-sync/completion-report.md`，含：
  - 2 commits hash
  - grep before/after 输出对比
  - 是否触发 R2（若是，附 additional-stale-items.md）
  - Manual smoke needed: NO
  - Outstanding concerns: NONE（or 列出）

## §D 不归档（由审计 AI 决定）

- [ ] D.1 **不**自动 `git mv .claude/sdd/docs-sync` 到 archive
- [ ] D.2 **不**自动跑 `/project:finish-feature`
- [ ] D.3 **不**修改 memory-bank/activeContext.md（claude 审计阶段统一同步）
