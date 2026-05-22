# Handoff — docs-sync

> 你（接收 AI）正在执行 TZBlog 的 docs-sync SDD。这是一个纯 markdown 同步任务，预计 10 分钟。

## 30 秒概览

R1（点赞永久 unique）+ R6（commentCount 仅计 APPROVED）决策已经在代码层落地，但是文档没跟上：

- `memory-bank/progress.md:142` + `:145` checkbox 没勾
- `CLAUDE.md:84` 仍说"点赞 24h 滚动"（已被 R1 改为永久 unique）

任务：3 处编辑 + 2 个 commit，全部走 `[no-tdd]` 白名单。

## 阅读顺序（按这个顺序读完再动手）

1. `.claude/sdd/handoff-pre-deploy/master.md` — 项目背景 / 技术栈 / TDD 工作流 / commit hook
2. `.claude/sdd/handoff-pre-deploy/handoff-guide.md` — 你的执行规则手册
3. `.claude/sdd/handoff-pre-deploy/known-findings.md` — 第一波 agent 摸到的 docs-sync 现状情报
4. `.claude/sdd/docs-sync/proposal.md` — Why / What / Decisions
5. `.claude/sdd/docs-sync/specs/checkbox-sync/spec.md` — checkbox 改动两条 spec
6. `.claude/sdd/docs-sync/specs/claude-md-sync/spec.md` — CLAUDE.md R1 同步一条 spec
7. `.claude/sdd/docs-sync/test-map.md` — grep 验证矩阵
8. `.claude/sdd/docs-sync/design-notes.md` — 决策细节、安全网、hook 失败对策
9. `.claude/sdd/docs-sync/tasks.md` — 你的执行清单（按 §0 → §A → §B → §C 顺序）

## 执行总览（来自 tasks.md）

```
§0 准备
   §0.1 读 5 个 context 文件
   §0.2 P2 段 grep 安全检查（R2 fallback）

§A checkbox-sync
   A.1 [SPEC-DS-CB-1] 勾 progress.md:142
       a [GREP-VERIFY-BEFORE]
       b [EDIT-APPLY]
       c [GREP-VERIFY-AFTER]
   A.2 [SPEC-DS-CB-2] 勾 progress.md:145
       a / b / c 同上
   A.3 [Commit] docs(memory-bank): ... [no-tdd]

§B claude-md-sync
   B.1 [SPEC-DS-MD-1] 改 CLAUDE.md:84
       a / b / c 同上
   B.2 [Commit] docs(claude-md): ... [no-tdd]

§C 验收
   C.1 git log 复核
   C.2 git diff --stat 复核
   C.3 跳过 pnpm test / lint / typecheck（无代码变更）
   C.4 写 completion-report.md

§D 不归档（claude 审计阶段统一做）
```

## 质量门

每个 commit 前**必须**：

1. `git diff <target-file>` — 看是否仅 line 142 / 145 / 84 改动
2. `git diff --cached --name-only` — 看 staged 仅是 target 文件
3. hook 输出含 `✓ [no-tdd] 通过白名单文件校验`

如果任何一步不过：
- 不要 `--no-verify` 绕过
- 不要修改 `.husky/commit-msg`
- 按 design-notes.md 的"[no-tdd] hook 失败的应对"段处理

## R2 安全网（重要！）

如果你在 §0.2 跑 P2 段 grep 时发现**非 142/145** 的 unchecked 行实际上已完成：

- **STOP**，不要扩大 scope
- 写 `.claude/sdd/docs-sync/additional-stale-items.md` 列出发现
- 在 completion-report.md 标注 "R2 triggered"
- 继续执行 §A/§B/§C 仅针对 142/145/84
- 等 ha1den 在审计阶段拍板是否追加修改

同理，如果你在 §B.1.a grep 发现 CLAUDE.md 含 "PENDING" / "commentCount 计 PENDING"，触发 R2。

## 不要做的事

| 禁止 | 为什么 |
|------|-------|
| 改 `.claude/sdd/archive/*` | archive 是时间快照，永远不动 |
| 改 `.husky/commit-msg` / `CLAUDE.md` 的其他行 | 范围外改动 |
| `git add -A` / `git add .` | 可能误 stage 非目标文件 |
| `git commit --no-verify` | 违反 CLAUDE.md 约束 |
| 改 `memory-bank/activeContext.md` / `knownIssues.md` | 不在范围（design-notes 段说明） |
| 跑 `/project:finish-feature` | 归档由审计 AI 统一做 |
| 跑 `pnpm test` / `pnpm build` | 无代码变更，浪费时间 |
| 扩大 R2 触发的额外 stale 修复 | YAGNI，停下等 ha1den |

## 完成后输出

写 `.claude/sdd/docs-sync/completion-report.md`：

```markdown
# Completion Report — docs-sync

## Commits
- <hash> docs(memory-bank): sync stale P2 checkboxes...
- <hash> docs(claude-md): sync R1 point-likes...

## grep validation
### before
<paste grep outputs>

### after
<paste grep outputs>

## R2 triggers
- progress.md grep: <none / list>
- CLAUDE.md grep: <none / list>

## Manual smoke needed: NO

## Outstanding concerns
<none / list>
```

然后停下来，等 claude 审计 + 归档。

## TL;DR

```
读 5 个 context 文件 → P2 段 grep 安全检查 →
执行 A.1 (grep before → Edit → grep after) → A.2 → A.3 commit memory-bank →
执行 B.1 (grep before → Edit → grep after) → B.2 commit claude-md →
git log/diff 复核 → 写 completion-report.md → 停。
```

收工。
