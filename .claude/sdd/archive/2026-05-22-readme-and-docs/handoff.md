# Handoff — readme-and-docs

> 你（接收 AI）正在执行 TZBlog 的 readme-and-docs SDD。预计 0.5 天。

## 30 秒概览

`README.md` 是 create-next-app boilerplate。`docs/` 不存在。要全部重写 README + 写 4 篇 docs + 加 MIT LICENSE。**几乎全 NO-TDD**（仅 *.md/LICENSE），仅 1 个 sanity test 验 README 不再含 boilerplate。

## 阅读顺序

1. master.md / handoff-guide.md / known-findings.md
2. CLAUDE.md（**完整读完**，这是内容主要源）
3. memory-bank/ 全部（补充上下文）
4. `.claude/sdd/readme-and-docs/proposal.md`
5. `.claude/sdd/readme-and-docs/specs/{readme,docs}/spec.md`
6. `.claude/sdd/readme-and-docs/test-map.md`
7. `.claude/sdd/readme-and-docs/design-notes.md` — 含 README 完整骨架 + docs/ 各文件骨架
8. `.claude/sdd/readme-and-docs/tasks.md`

## 依赖

- CLAUDE.md（内容源）
- memory-bank/ (补充)
- husky hook（commit msg 必须带 `[no-tdd]` 给纯 md commit；hook 白名单接受 *.md）

## 执行总览

```
§A README + sanity test (1 TDD pair: test + chore-readme)
§B docs/ × 4 (4 个 NO-TDD commits)
§C LICENSE (1 NO-TDD commit)
```

7 commits 总。

## 关键约束

- **chore(readme) / docs(...) / chore(license)** 全带 `[no-tdd]` 标签
- **sanity test** 用 `test(docs-sanity)` type → hook 不强制要求 feat
- **不删 CLAUDE.md** — 项目级 AI instructions 仍保留
- **不复述 CLAUDE.md 全文** — docs/ 是人话版，CLAUDE.md 是 AI spec
- **screenshot 占位 + TODO 注释** — 不生成假图
- **MIT license** — 默认；如果 ha1den 想换 license，handoff 时讨论

## 内容语气

- 中文为主
- 命令 / 代码 / 路径英文
- 简洁，不啰嗦
- 信息密度高
- 顶端时间戳 `> Last verified: 2026-05-22`

## husky hook 详查

CLAUDE.md `.husky/commit-msg` 规则：
- 未带 `[no-tdd]` 的 `feat:` 必须前 5 个 commit 找到同 scope `test:`
- `chore` / `docs` / `test` type 不被 hook 强制要求

但 NO-TDD 白名单还要看 staged 文件类型。本任务 staged 文件全是 *.md / LICENSE，安全。

**如果 `chore(license)` 提交 LICENSE 文件被 hook 拒**（hook 白名单可能没含 LICENSE）：
- 选项 1：把 LICENSE 命名为 `LICENSE.md`（保留 LICENSE.md 也合法）
- 选项 2：先临时改 hook 白名单 → 提交 → 回滚 hook 修改
- 选项 3：手动同提交 README + LICENSE（README 触发白名单，LICENSE 同 commit 被允许？取决于 hook 逻辑）
- **推荐：先 dry-run 一次看 hook 报错，再决定**

## 禁止事项

| 禁止 | 为什么 |
|------|-------|
| 删 CLAUDE.md | AI instructions 仍需 |
| 删 memory-bank/ 内容 | 项目上下文 |
| 加 vercel deploy button | 自部署 |
| 写 changelog / contributing | 增量 |
| 接 docusaurus | 零依赖 |
| `--no-verify` | 违反 |
| 生成假 screenshot | placeholder + TODO 注释 |

## 完成后输出

`.claude/sdd/readme-and-docs/completion-report.md` 含：
- 7 commits hash
- sanity test 状态
- review checklist 勾选
- husky hook 是否平稳通过（特别是 LICENSE commit）
- ha1den 上线后需补 screenshot 提醒

## TL;DR

```
读 SDD + CLAUDE.md + memory-bank → §A sanity test RED + README rewrite → §B 4 docs files → §C LICENSE → 全套质量门 → completion-report → 停。
```

收工。
