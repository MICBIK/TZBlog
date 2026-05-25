# Spec 08 · Reading Mode

> ARTICLE 详情阅读体验：Ink 主题 + 衬线字 + 52ch 行宽 + 朱砂落款 + TOC + 进度条。
>
> Reference: `theme-token-strategy.md` §3 (Ink theme) / `demo-front/directions/05-ink-garden.md`

---

## Specs

| Spec-ID | GIVEN | WHEN | THEN |
|---------|-------|------|------|
| read-001 | ARTICLE 详情页 | 渲染 | `data-theme="ink"` + Noto Serif SC + 52ch max-width |
| read-002 | 文章长 > 1000 字 | 渲染 | TOC 侧栏在桌面端 sticky 显示 |
| read-003 | TOC item 点击 | 触发 | 平滑滚动到对应 heading |
| read-004 | 滚动文章 | 触发 | 顶部进度条宽度更新 |
| read-005 | 文章 footer | 渲染 | 朱砂方印 `■` + 作者署名 + 日期 + 字数 |
| read-006 | 段落首行 | 渲染 | 中文不缩进，西式排版 |
| read-007 | h2 | 渲染 | 上 margin 4em + 衬线粗 |
| read-008 | blockquote | 渲染 | 左缩进 + 朱砂引号符 |
| read-009 | code fence | 渲染 | Shiki 高亮 + 顶栏含 language + copy 按钮 |
| read-010 | GH alert NOTE/TIP/WARNING/IMPORTANT/CAUTION | 渲染 | 各自颜色 + icon |
| read-011 | mobile 375px | 渲染 | TOC 改为顶部折叠 + 字号缩放 |
| read-012 | `prefers-reduced-motion: reduce` | 加载 | 段落浮现动画禁用 |

---

## Test File

- `src/components/reading/ArticleReader.test.tsx`
- `src/components/reading/Toc.test.tsx`
- `src/components/reading/ReadingProgress.test.tsx`
- `e2e/reading-mode.spec.ts`

---

## Acceptance

- [ ] 12 spec 全 pass
- [ ] 截图对比 Ink Garden demo 还原 ≥ 95%

---

<!-- 此文件由 explore 自动生成草稿，请审阅。生成时间：2026-05-25T13:40:00Z -->
