# design-notes — docs-sync

> 设计决策细节、备选权衡、安全网

## R1：单 commit vs 双 commit 包两个 area

**选**：双 commit（`docs(memory-bank): ...` + `docs(claude-md): ...`）

**理由**：
- 历史更清晰：将来 git log 查"什么时候同步的 R1 决策"vs"什么时候勾的 P2 checkbox"，两个 commit 比一个 commit 更易定位
- scope 一致性：`docs(memory-bank)` 和 `docs(claude-md)` 是两个不同 scope，conventional commits 风格也是分开为佳
- 回滚粒度：如果 ha1den 后续想撤回某一个 area 的改动，可以 `git revert <hash>` 而不影响另一个

**反方观点**（不采纳）：
- "两个 commit 太碎，1 个 commit 也够"——但 docs-sync 本身就只有这两件事，分开不会让历史显得过碎
- "如果只有 1 行改动，单 commit 更轻"——R1 那个改动确实只 1 行，但加上 checkbox 那两行也只 3 行；划分 scope 更重要

## R2：grep 发现 MORE stale 项时如何处理

**选**：stop + report，不擅自扩大 scope

**理由**：
- YAGNI：spec 只覆盖 142 / 145 / line 84 三处，其他都是未知；擅自改会让审计 AI 无法追溯改动来源
- 安全：进度文档（progress.md）有人工录入习惯，可能有些 checkbox 故意 unchecked（如"先 ship 后勾"流程）；不应自动勾
- 透明：把发现写到 `additional-stale-items.md` 让 ha1den 决定，比"AI 已自动修复"更可控

**实施细节**：
- 实施 AI 跑完 §0.2 的 P2 段 grep 后，如果发现非 142/145 的 unchecked 行实际上完成了，**不要 EDIT**
- 写到 `.claude/sdd/docs-sync/additional-stale-items.md`，格式：
  ```markdown
  # Additional Stale Items (R2 trigger)

  ## progress.md line X
  Current text: <text>
  Suspected status: shipped via <SDD name>
  Evidence: <commit/archive>
  ```
- 在 completion-report.md 标注 "R2 triggered, 见 additional-stale-items.md"
- 然后停下来，等 ha1den 在审计阶段拍板

## R3：`[no-tdd]` 标签是否安全

**选**：安全

**理由**：
- husky commit-msg hook 已有 white-list 二次校验（仅 `*.css/*.scss/*.sass/*.less/*.md/*.mdx/*.txt/*.rst` 通过）
- 本任务 staged 文件是纯 `.md`（`memory-bank/progress.md` 和 `CLAUDE.md`），100% 在白名单
- hook 在 commit 时会自动验证 staged file list，避免误用

**关键操作**：
- `git add` 时**只 add 目标文件**：`git add memory-bank/progress.md` 和 `git add CLAUDE.md`，**不要** `git add -A` / `git add .`
- 若已有其他 unstaged 修改（其他 SDD 的 work / agent 痕迹），不要 stage
- commit 前跑 `git diff --cached --name-only` 复核

## R4：勾选时是否附加 archive 引用

**选**：附加

**理由**：
- audit trail：将来读 progress.md 的人能立刻看到"这个项是哪个 SDD 完成的"，无需翻 git log
- 阅读体验：勾选后的描述更丰富，比纯 `[x]` 更有信息密度
- 一致性：progress.md 现有的勾选项（如 D1/D2/D3 等）也都带 commits 引用

**格式**：
- `- [x] <原描述> —— <补充说明>（archive/2026-05-21-<name>/）`
- 中文全角连字符 `——` 作为分隔（与 progress.md 现有风格一致）

## [no-tdd] hook 失败的应对

如果 commit 被 hook 拒绝（提示 `[no-tdd] 滥用：staged 文件含非样式/文档文件`）：

1. 跑 `git diff --cached --name-only` 看违规文件
2. `git reset HEAD <违规文件>` 把它从 staging 移出
3. 重试 commit

**不要**：
- ~~跑 `git commit --no-verify`~~（违反 CLAUDE.md 破坏性操作约束 + 绕过 audit）
- ~~改 `.husky/commit-msg` 让它放行~~（同上 + 修改了不该修改的文件）

## EDIT 工具的使用约束

Edit 工具要求 `old_string` 在文件中唯一。本任务的三处改动恰好都是唯一字符串：

- `memory-bank/progress.md:142` 含 "文章详情（Shiki + TOC + 浏览上报 + 点赞 + 评论区）" — grep 已确认全文唯一
- `memory-bank/progress.md:145` 含 "自研 Analytics 客户端上报（<AnalyticsBeacon>）" — grep 已确认全文唯一
- `CLAUDE.md:84` 含 "点赞：同访客 + 同文章 24h 内一次" — grep 已确认全文唯一

如果 Edit 报 "old_string not unique"，先 `Read` 文件 + 重新构造更长 `old_string`（加上下文行）。

## 不修改 archive 的硬约束

`.claude/sdd/archive/*` 是时间快照，**永远不动**。

如果实施 AI 在 grep 时偶然命中 archive 内的某个文件，**忽略**。target 文件只有：
- `memory-bank/progress.md`
- `CLAUDE.md`

其他任何文件路径出现在 Edit/Write 调用都是 bug。

## activeContext.md / knownIssues.md 不在范围

虽然 activeContext.md 和 knownIssues.md 也可能有 stale，但：
- activeContext.md 是"当前焦点"，每个 session 通过 `/project:update-context` 自然更新；不需要本 SDD 干预
- knownIssues.md 是"已知问题"，R1/R6 没有产生新 known issue，无需同步

如果实施 AI 觉得这两个文件也需要 sync，按 R2 处理（stop + report）。
