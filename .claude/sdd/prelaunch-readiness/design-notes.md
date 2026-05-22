# prelaunch-readiness design notes

## Findings

- `pnpm build` 当前通过，但有两个框架 warning：Next.js `middleware` convention deprecated、Prisma `driverAdapters` preview deprecated。
- `README.md`、`AGENTS.md`、`CLAUDE.md`、`memory-bank/*` 中存在 Next.js 15 / Prisma 5 / Tiptap WYSIWYG / `middleware.ts` 等过期表述。
- `src/components/site/TechStack.tsx` 展示 `Next.js 15` 和 `Tiptap v2`，与 `package.json` 和实际编辑器状态不一致。
- `src/lib/content/about.ts` 仍包含 `TODO[pre-launch]` 和 `Placeholder:` 文案，不适合上线展示。
- `memory-bank/progress.md` 中 P2/P4 和 `window.confirm` 技术债已过期；源码中 PostsTable / ColumnsTable / CommentsTable 已使用 AlertDialog。

## Readiness Boundary

本轮把“上线前必须清掉”的内容做完，并把 V2/V3 拆成 backlog：

- V2 backlog：主题 GUI、详细 Analytics、评论邮件通知、编辑器增强。
- V3 backlog：`/en` 多语言、locale routing、英文内容录入。

完整 V2/V3 功能应各自开独立 SDD，因为会涉及 DB/UI/API/邮件服务/路由结构，不适合混在本轮债务清理中。

