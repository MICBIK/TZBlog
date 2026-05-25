# Active Context — TZBlog

> 当前正在做什么 / 下一步是什么。每次会话结束前应该是最新的。

## 当前焦点

**`blog-ia-redesign` 已在 `feat/blog-ia-redesign` 分支完成 M1~M5 开发与质量门。**

- 质量门：`pnpm typecheck` / `lint` / `test` (672) / `build` 全绿（2026-05-25）
- Milestone tags：`m1` ~ `m5` 已打（含追溯 `m2` / `m3`）
- 下一步：PR review → merge → VPS deploy smoke → HaiDen 主观验收（acceptance-criteria §10）

## 分支状态

- 主 feature 分支：`feat/blog-ia-redesign`
- 回滚锚点：`pre-blog-ia-redesign`
- SDD：`/.claude/sdd/blog-ia-redesign/`（`KNOWN-DEVIATIONS.md` 无 skip）

## 关键路径

| 区域 | 入口 |
|------|------|
| 公开首页 | `src/app/(site)/page.tsx` + `HomePageContent` |
| Channel 页 | `src/app/(site)/c/[slug]/page.tsx` |
| 长文详情 | `src/app/(site)/posts/[slug]/page.tsx` (Ink) |
| 留言板 | `src/app/(site)/guestbook/page.tsx` |
| Admin 条目 | `src/app/(admin)/admin/entries/*` |
| Admin 频道 | `src/app/(admin)/admin/channels/*` |
| 编辑器 | `src/components/editor/MilkdownEditor.tsx` |
| 推荐 cron | `docker/cron.Dockerfile` + `src/lib/jobs/cron-runner.ts` |
