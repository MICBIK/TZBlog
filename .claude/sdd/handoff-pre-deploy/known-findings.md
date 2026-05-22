# Known Findings — 第一波 agent 摸出的现状情报

> 第一波 dispatch 因 sandbox 拒 Write 集体未完成，但 agent 做了 read-only 探查。下面是值得复用的发现，**重新派发的 agent 必读**以省去重复探查时间。

## 全局路径修正

- **`globals.css` 实际路径**：`src/app/globals.css`（不是 `src/styles/globals.css`，后者不存在）
- `src/styles/` 目录**不存在**
- 现有 `--font-sans` 已 chain `--font-geist-sans` + CJK fallback（不要直接覆盖；Editorial 接入新增 `--font-serif`，并把 sans 改为 `var(--font-inter)` 链路）
- 现有 `--font-geist-mono` 保留（mono 不用换）

## 任务专属现状（按 SDD）

### docs-sync

**`memory-bank/progress.md` 确认的 stale checkbox**：
- 第 142 行：`[ ] 文章详情（Shiki + TOC + 浏览上报 + 点赞 + 评论区）` — 已全部 shipped
- 第 145 行：`[ ] 自研 Analytics 客户端上报（<AnalyticsBeacon>）` — 已 shipped (analytics-beacon SDD)

**`CLAUDE.md` 确认的 stale 行**：
- 第 84 行：`- 点赞：同访客 + 同文章 24h 内一次` — R1 改为永久 unique
- "PENDING" / "commentCount 计 PENDING" 字符串**不存在**于 CLAUDE.md（grep 已确认） — 无需 R6 相关修改

**Schema 验证**：`prisma/schema.prisma:210` 含 `@@unique([postId, visitorHash])`，确认永久 unique 已实现，CLAUDE.md 该行确实滞后

### confirm-dialog-replication

- shadcn `alert-dialog` 组件已就位 (`src/components/ui/alert-dialog.tsx`)，无需新装
- CommentsTable 参考实现：commits `c466f52` (test) + `593be7f` (feat)
- 待复刻：`PostsTable.tsx:71` + `ColumnsTable.tsx:122`
- 测试 mock 模式：现有用 `vi.stubGlobal("confirm", mocks.confirm)`，需移除

### hero-editorial

**Font pair 推荐**：`Source Serif 4` + `Inter`（`next/font/google`，`subsets: ["latin"]`）
**Motion 推荐**：CSS-only（不装 Framer Motion）
**Primitive 抽取**：不在 1.1 阶段抽 `IssueLabel`/`Dateline`（YAGNI，2.1 后再决定）
**Editorial signature elements 候选**：hairline label / dateline / rule line (`w-12 border-t border-border`) / numbered marginalia
**Layout 推荐**：`lg:grid-cols-[7fr_5fr]` 不对称
**Playwright 缺口**：`package.json` 当前无 Playwright；视觉回归测试在 jsdom 不可达，需文档化（建议 lighthouse-prep 任务或 P4 阶段引入）

### tech-stack-section

- 数据源：`src/app/(site)/page.tsx` lines 9-16 (techStack const) + lines 46-61 (terminal `$ whoami` 段)
- 测试 pattern：`src/app/(site)/page.test.tsx` 用 `vi.hoisted` + `vi.mock` for `getCurrentLocale` / `listPosts` / `getSiteStats`，`render(await HomePage())`
- 推荐 5 类目：Frontend / Content & Editor / Backend & Data / Infra / Tooling

### github-data-card

- `GITHUB_USERNAME` env var **已存在** `src/lib/env.ts:16`（`z.string().optional()`），无需新加
- 现有 service pattern：`src/lib/services/stats.ts` — 单函数返回 plain object
- `AppError` 含 `upstream()` / `notFound()` / `missingEnv()`，覆盖所有 fallback 场景
- Vitest 配置：`.test.ts` → node env (service/schema)，`.test.tsx` → jsdom (component)
- Fallback 触发：missing env / 4xx / 5xx / zod parse fail / network → `console.warn` + 返回 `{ status: "unavailable", reason }`
- Spec 规模：5 schema + 6 service + 4 component = 15 specs + 1 page integration

### about-page

- 当前 `src/app/(site)/about/page.tsx` 是 "Coming soon." 占位（约 6 行）
- 可直接重写，无现存内容损失风险

### tags-pages

- **关键发现**：`Tag` 模型**无 translation 子表**（locale-free），与 Column 不同
- 现有 `listTags()` 函数已存在并返回 `id/slug/name/postCount`（默认按 name asc 排序）— /tags 页只需消费此函数 + 重排
- 现有 `/columns` 用 `notFound + posts query` 模式，可对镜
- `PostCard` 可直接复用
- `/posts` 用 `?page=N&pageSize=12` 分页
- Sitemap 排除策略：Tag 无 translation，应按"无 PUBLISHED post 时排除"
- Sitemap 测试参考：现有 `excludes columns without DEFAULT_LOCALE translation` 测试

### analytics-dashboard

- PageView 表已就绪（analytics-beacon 在采）
- AdminSidebar pattern：`src/components/admin/AdminSidebar.tsx`
- 现有 admin 页面 layout pattern 参考 `/admin/comments`

### readme-and-docs

- `docs/` 目录可能不存在，需创建（agent 验证后说明 if needed）
- 大量 pnpm scripts 在 `package.json` 中，需列举

### lighthouse-prep

- `next.config.ts` 当前配置需 inspect
- `@next/bundle-analyzer` 与 `web-vitals` 当前**未安装**（agent 已 grep package.json）
- AnalyticsBeacon (`src/components/site/AnalyticsBeacon.tsx`) 已存在，Web Vitals reporter 可挂入

## Sandbox 修正

第二波重派全部带 `mode: "acceptEdits"` 解除 Write 拒绝。无需调整其他 agent brief。
