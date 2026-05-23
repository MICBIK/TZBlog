# Proposal — final-experience-hardening

## Problem

`creative-blog-notion-editor` 已完成主体改造，但当前本地可验收体验仍暴露三个交付风险：

1. 空数据库下公开站首页、文章、专栏、标签页缺少真实展示内容，无法验证最终视觉和文章详情体验。
2. `/admin/_editor-demo` 仍能作为内部 PoC 界面访问，容易被误认为生产功能。
3. 部分公开索引页仍有临时感：标签页英文 chrome、专栏卡片未消费 cover、最终浏览器 smoke 缺少有内容路径。

## Approach

- 增加可重复、幂等的 showcase seed 内容：至少 3 篇 PUBLISHED 文章、2 个专栏、多个标签、cover / inline image / code / table / alert / interactive marker 等 Markdown 样例，用现有 `/uploads/audit-*` 占位资源或 CSS-safe fallback。
- 保留 Markdown string 存储契约，不引入 rich editor 私有 schema。
- 将内部 editor demo 路由改为生产不可访问的 notFound，不再暴露独立 sandbox UI。
- 打磨公开索引页 chrome：中文单语一致，专栏 cover 可渲染，文章/专栏/标签都能从 seed 内容形成可点击路径。
- 完成后跑命令质量门和浏览器 smoke，覆盖首页、文章列表、文章详情、专栏列表/详情、标签列表/详情、后台新建文章、媒体、评论、概览。

## Scope

- `prisma/seed.ts`
- `src/app/(admin)/admin/_editor-demo/page.tsx`
- `src/app/(admin)/admin/_editor-demo/page.test.tsx`
- `src/app/(site)/tags/page.tsx`
- `src/app/(site)/tags/page.test.tsx`
- `src/components/site/ColumnCard.tsx`
- `src/components/site/ColumnCard.test.tsx`
- `memory-bank/progress.md`
- `.claude/sdd/final-experience-hardening/*`

## Out of Scope

- 不改数据库 schema。
- 不接入第三方 rich/block editor。
- 不做 V2 主题 GUI / 邮件通知 / 多语言 routing。

## Acceptance

- `pnpm db:seed` 后公开站不再只显示空态；首页、文章列表、专栏、标签均有真实可点击内容。
- 文章详情页能展示 cover、TOC、code block、image frame、interactive fallback、评论区和点赞按钮。
- `/admin/_editor-demo` 不再展示 demo editor surface。
- `pnpm typecheck` / `pnpm lint` / `pnpm test` / `pnpm build` 全绿。
- 浏览器 smoke 覆盖 desktop + mobile，不交付明显未完成界面。

<!-- Draft auto-generated from explore. Review before use. Generated: 2026-05-24T00:00:00+08:00 -->
