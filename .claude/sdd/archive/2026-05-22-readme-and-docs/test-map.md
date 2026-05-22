# test-map.md — readme-and-docs

> 注意：本 SDD 是 NO-TDD 大头 + 1 个 sanity test。

| spec-id | 测试函数 | 文件 | 层级 |
|---|---|---|---|
| SPEC-DOC-R-1 | （无 typed test；review 验 README 标题完整） | manual review | — |
| SPEC-DOC-R-2 | （无 typed test；review 验 quickstart 命令存在） | manual review | — |
| SPEC-DOC-R-3 | （无 typed test；review 验 stack table） | manual review | — |
| SPEC-DOC-R-4 | `README sanity (no boilerplate, has identity markers)` | `tests/docs-sanity.test.ts` | node |
| SPEC-DOC-D-1 | （无 typed test；manual review） | — | — |
| SPEC-DOC-D-2 | （无 typed test；manual review） | — | — |
| SPEC-DOC-D-3 | （无 typed test；manual review） | — | — |
| SPEC-DOC-D-4 | （无 typed test；manual review） | — | — |

## Review checklist (replaces typed tests for content specs)

完成后人工或 LLM-assisted review：
- README 6 段标题齐
- README quickstart 5 command 齐
- README stack 9 项齐
- 4 个 docs/ 文件存在
- 每个 docs/ 顶端有 `> Last verified: 2026-05-22`
- 每个 docs/ 节标题覆盖 SPEC 列表
- LICENSE 存在且为 MIT
