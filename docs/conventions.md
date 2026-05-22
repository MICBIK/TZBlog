> Last verified: 2026-05-22

# 约定

TZBlog 以 SDD + TDD 作为默认开发节奏。文档、样式和实现都不是随手改，commit 也要能回溯到具体 spec。

## Commit

使用 Conventional Commits，并带 scope。

常见类型：

- `feat(scope): ...`
- `fix(scope): ...`
- `refactor(scope): ...`
- `test(scope): ...`
- `chore(scope): ...`
- `docs(scope): ...`
- `perf(scope): ...`
- `ci(scope): ...`

示例：

```text
feat(post-detail): SPEC-FOO-1 add comment form
test(post-detail): SPEC-FOO-1 comment form validation
docs(deployment): SPEC-DOC-D-2 self-hosted deployment guide [no-tdd]
```

scope 尽量和改动模块一致，spec-id 留在 commit message 里，方便后来回溯到对应 SDD。

## TDD 节奏

标准微循环是：

1. `test(scope): SPEC RED`
2. `feat(scope): SPEC GREEN`

要求：

- 同一 spec 的 test 和 implementation 绑在一起。
- 先 RED 再 GREEN，不批量把测试堆到最后。
- RED 要有真实失败输出，不接受“应该会失败”的口头说明。
- GREEN 要有真实 PASS 输出。

## husky commit-msg hook

当前仓库的 `commit-msg` hook 会检查两件事：

- 未带 `[no-tdd]` 的 `feat:` 提交，前 5 个 commit 里必须出现同 scope 的 `test:`。
- 带 `[no-tdd]` 的提交只允许白名单文件通过。

白名单按仓库现状主要覆盖：

- `*.css`
- `*.scss`
- `*.sass`
- `*.less`
- `*.postcss`
- `*.md`
- `*.mdx`
- `*.txt`
- `*.rst`

## NO-TDD 例外

只有这些情况可以不用 TDD 微循环：

- 纯文档
- 纯样式

要求：

- commit message 必须带 `[no-tdd]`。
- staged 文件只能落在白名单里。
- 不要把配置变更、依赖变更、实现代码混进来。

`LICENSE` 这类无后缀交付文件在仓库里也按文档交付处理，但提交时仍要保证它是单文件、单目的的 no-tdd commit。

## SDD (Spec-Driven Development)

每个 feature 先有 `.claude/sdd/<feature>/`，再执行实现。

目录里通常包含：

- `proposal.md`
- `specs/*/spec.md`
- `test-map.md`
- `tasks.md`
- `design-notes.md`
- `handoff.md`

原则：

- 每个 spec 对应一个微循环。
- `test-map` 是实现前的固定映射。
- 没有 test-map，就不要开始写 tasks。

## 命名

- 组件：`PascalCase.tsx`
- 工具：`camelCase.ts`
- 测试：`*.test.ts` / `*.test.tsx`
- 测试文件尽量和被测文件同目录

## 实践建议

- 先读真实文件，再写文档或代码。
- 不要靠记忆写路径和脚本名。
- 不要把 `README.md` 写成另一份 CLAUDE.md。
- 文档里写具体命令时，优先和 `package.json`、`docker/`、`.env.example` 对齐。
