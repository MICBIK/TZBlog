# Spec 09 · Terminal Stream

> STREAM channel + GREP layout 的 Terminal 主题特殊渲染。
>
> Reference: `theme-token-strategy.md` §3 (Terminal theme) / `demo-front/directions/03-terminal-workshop.md`

---

## Specs

| Spec-ID | GIVEN | WHEN | THEN |
|---------|-------|------|------|
| term-001 | Channel STREAM 页 | 渲染 | `data-theme="terminal"` + JetBrains Mono + 黑底荧光绿 |
| term-002 | STREAM 顶部 prompt | 渲染 | `hai@tzblog:~/<slug>$ █` + 闪烁光标 |
| term-003 | GREP filter input | 输入关键字 | 实时高亮匹配行 + 不匹配隐藏 |
| term-004 | 列表行 | 渲染 | 等宽 columns（time / title / source / tags） |
| term-005 | hover 链接 | hover | 出现下划线 + 前缀 `>` 字符滑入 |
| term-006 | 文章详情（kind=NOTE/LINK/QUOTE in STREAM） | 渲染 | 顶部 vim-style 路径 + line numbers 侧栏 |
| term-007 | code block in stream entry | 渲染 | Prism / Shiki 高亮 + 顶部 path |
| term-008 | mobile 375px | 渲染 | line numbers 隐藏，filter input 保留 |
| term-009 | `prefers-reduced-motion: reduce` | 加载 | 光标不闪 + 无 boot animation |
| term-010 | 启动序列（首次访问 STREAM 主页） | 渲染 | "boot log" 4-6 行 + 可跳过 (1.2s) |

---

## Test File

- `src/components/channel-layouts/GrepLayout.test.tsx`（已含在 spec 06）
- `src/components/terminal/TerminalShell.test.tsx`
- `src/components/terminal/BootSequence.test.tsx`

---

## Acceptance

- [x] 10 spec 全 pass
- [x] smoke 截图已生成（`smoke/m4-public-ui/terminal-*` + `entry-*`），待人工对比 ≥ 90%
- [ ] 用户测试通过：HaiDen 在 Terminal Workshop demo 反馈 "存在一些交互上的问题"——本次重构必须修复（具体待 HaiDen 标注）

---

<!-- 此文件由 explore 自动生成草稿，请审阅。生成时间：2026-05-25T13:40:00Z -->
