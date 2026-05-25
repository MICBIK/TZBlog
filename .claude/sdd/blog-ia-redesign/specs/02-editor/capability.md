# Spec 02 · Editor (Milkdown)

> Milkdown 编辑器集成，替代历史 BlockNote/CodeMirror。
>
> Reference: `editor-comparison.md` §1-§10 / `design-notes.md` Q11 + A11

---

## Intent

实现 Notion/Obsidian 级别 Markdown 编辑器：
- 存储格式始终为 Markdown 字符串（不切 JSON）
- 复用现有 `renderMarkdown` 管道做 preview
- 必须通过 Markdown round-trip parity（8 fixture）
- 支持 slash menu / bubble menu / 图片上传 / 代码块高亮 / GitHub Alert / Mod+S

---

## Specs

| Spec-ID | GIVEN | WHEN | THEN |
|---------|-------|------|------|
| editor-001 | MilkdownEditor 加载 `basic.md` fixture | parse → serialize 一次 | 输出与原文字面相等 |
| editor-002 | MilkdownEditor 加载 `list.md` fixture | parse → serialize | 同上 |
| editor-003 | MilkdownEditor 加载 `code.md` fixture（含 ts/bash/json 三种语言） | parse → serialize | 同上，language hint 保留 |
| editor-004 | MilkdownEditor 加载 `table.md` fixture（中文 cell + 转义 pipe） | parse → serialize | 同上 |
| editor-005 | MilkdownEditor 加载 `alert.md` fixture（NOTE/TIP/IMPORTANT/WARNING/CAUTION） | parse → serialize | 5 个 alert 全部保留 |
| editor-006 | MilkdownEditor 加载 `image-link.md` fixture | parse → serialize | image + link with title 保留 |
| editor-007 | MilkdownEditor 加载 `blockquote.md` fixture | parse → serialize | 单行 + 多行 blockquote 保留，无 `\` 硬中断残留 |
| editor-008 | MilkdownEditor 加载 `mixed.md`（含 `<kbd>` `<sup>`） | parse → serialize | inline HTML 保留**或**有可控降级（必须文档化） |
| editor-009 | MilkdownEditor 加载 fixture | parse → serialize → renderMarkdown(both) | HTML normalized 相等 |
| editor-010 | MilkdownEditor 已挂载 | 用户输入 `/` | slash menu 出现，定位于 caret |
| editor-011 | MilkdownEditor 已挂载 | 用户选中文本 | bubble menu 出现，定位于 selection |
| editor-012 | MilkdownEditor 已挂载，mediaItems 已注入 | 拖拽图片到编辑器 | 触发 `/api/media/upload`，成功后插入 `![alt](url)` markdown |
| editor-013 | MilkdownEditor 已挂载 | 用户按 `Mod+S` | 触发 `onSave` callback，event 被 preventDefault |
| editor-014 | MilkdownEditor with theme='dark' | 渲染 | container 含 `data-theme="dark"` |
| editor-015 | MilkdownEditor 触发 onChange | 300ms 内连续 5 次变更 | debounce 后只触发一次 `onChange(normalizedMarkdown)` |
| editor-016 | MilkdownEditor 接收 unsafe URL（blob:/data:/javascript:） | 通过 upload plugin | 拒绝插入，不产生 onChange |
| editor-017 | MilkdownEditor 在 mobile viewport (375px) | 渲染 | 不发生水平 overflow |
| editor-018 | `prefers-reduced-motion: reduce` | MilkdownEditor 渲染 | 动画禁用 |

---

## Test File 映射

- `src/components/editor/round-trip.test.ts` → editor-001 ~ editor-009
- `src/components/editor/MilkdownEditor.test.tsx` → editor-010 ~ editor-018

---

## Acceptance

- [ ] Gate A：依赖 + 兼容性确认（详见 `editor-comparison.md` §4.1）
- [ ] Gate B：round-trip 8 fixture 全 pass
- [ ] Gate C：editor shell 18 spec 全 pass
- [ ] Gate D：production smoke 全过

---

## Don't

- 不在 DB 存 ProseMirror JSON
- 不复用 BlockNote `markdownBridge.ts` 模块（已被 cleanup）
- 不写 mini renderer 做 preview
- 不接 AI 补全（V2 backlog）
- 不接 Y.js 协同（永不做）

---

<!-- 此文件由 explore 自动生成草稿，请审阅。生成时间：2026-05-25T13:35:00Z -->
