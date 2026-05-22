# test-map.md — docs-sync

> spec-id → grep 验证命令 + expected output state
> 本任务无 vitest 单元测试（pure markdown 编辑）；"测试" 等于 grep before/after 状态对比

## checkbox-sync

| spec-id | 阶段 | grep 命令 | Expected |
|---|---|---|---|
| SPEC-DS-CB-1 | before | `grep -n "文章详情（Shiki + TOC" memory-bank/progress.md` | 1 hit, line 142, contains `[ ]` |
| SPEC-DS-CB-1 | after | `grep -n "文章详情（Shiki + TOC" memory-bank/progress.md` | 1 hit, line 142, contains `[x]` + archive reference |
| SPEC-DS-CB-1 | safety | `grep -nE "^- \[ \]" memory-bank/progress.md \| head -20` | snapshot pre + post — only 2 lines should flip status (CB-1 + CB-2); rest unchanged |
| SPEC-DS-CB-2 | before | `grep -n "自研 Analytics 客户端上报" memory-bank/progress.md` | 1 hit, line 145, contains `[ ]` |
| SPEC-DS-CB-2 | after | `grep -n "自研 Analytics 客户端上报" memory-bank/progress.md` | 1 hit, line 145, contains `[x]` + archive reference |

## claude-md-sync

| spec-id | 阶段 | grep 命令 | Expected |
|---|---|---|---|
| SPEC-DS-MD-1 | before | `grep -n "24h" CLAUDE.md` | ≥1 hit; at least one matches "点赞" context |
| SPEC-DS-MD-1 | before | `grep -n "永久 unique" CLAUDE.md` | 0 hits |
| SPEC-DS-MD-1 | after | `grep -n "24h" CLAUDE.md` | 0 hits matching "点赞" context (其他 "24h" 若用于其他场景应保留) |
| SPEC-DS-MD-1 | after | `grep -n "永久 unique" CLAUDE.md` | ≥1 hit, including line 84 |
| SPEC-DS-MD-1 | safety | `grep -ni "PENDING\|commentCount 计 PENDING" CLAUDE.md` | 0 hits — if non-zero, trigger R2 (stop + report) |

## Diff sanity check（每次 commit 前必跑）

| 命令 | Expected |
|---|---|
| `git diff memory-bank/progress.md` | 仅 2 行变更（line 142 + line 145），均为 `[ ]` → `[x]` + 追加文本 |
| `git diff CLAUDE.md` | 仅 1 行变更（line 84），从 "24h" 描述改为 "永久 unique" |
| `git diff --stat` | `memory-bank/progress.md \| 2 +- ` 和 `CLAUDE.md \| 2 +-`（粗略；实际 +-数视追加文本而定） |

## Staged-files white-list 验证（[no-tdd] hook 前置）

| 阶段 | 命令 | Expected |
|---|---|---|
| stage memory-bank | `git status --short` 后 `git add memory-bank/progress.md` 然后 `git diff --cached --name-only` | 仅 `memory-bank/progress.md`；100% 在 `*.md` 白名单 |
| stage claude-md | `git add CLAUDE.md` 然后 `git diff --cached --name-only` | 仅 `CLAUDE.md`；100% 在 `*.md` 白名单 |

如有任何非 `.md` 文件出现在 staged 列表（例如错误 stage 了 `.husky/commit-msg` 或别的修改），**[no-tdd] hook 会拒绝 commit**。实施 AI 必须 `git reset HEAD <file>` 把非目标文件移出 staging。

## 不需要的验证

- 不需要跑 `pnpm test` / `pnpm typecheck` / `pnpm lint`（文档改不影响代码）
- 不需要 `pnpm build`
- 不需要 manual smoke
