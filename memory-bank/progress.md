# Progress — TZBlog

## 当前焦点

- **2026-05-25** `blog-ia-redesign` 长任务进行中：M1–M2 已完成；M3 `theme-tokens` + `public-shell` TDD 审计与 rebase 已闭环；M4 `home-composition` 已启动。
- 当前窗口：M4 `home-composition` **home-001 ~ home-010 全闭环**（动态 Channel preview + trending + hero + Lighthouse mobile + bundle gate + 动态频道 e2e）；下一步进入 `channel-pages`（chl-001~）。

## 已完成

- [x] **2026-05-26** `blog-ia-redesign` M4 `home-composition` 完成：`home-001~010` TDD 闭环（含 Lighthouse mobile ≥85、bundle gzip <250KiB、动态 Channel e2e）。
- [x] **2026-05-25** `blog-ia-redesign` M1 完成：
  - [x] `schema-001 ~ schema-010` / `mig-001 ~ mig-010` / `m1-gate-seed-showcase`
  - [x] `cleanup-prep`：`HomeGarden` 残留清理、`@blocknote/@codemirror` 直接引用清零、M1 guard 落地
  - [x] 质量门：`pnpm typecheck` / `pnpm lint` / `pnpm test` / `pnpm build` 全绿
  - [x] `pnpm prisma migrate status` up to date，Prisma smoke `channels_count=3`
  - [x] tag：`m1-schema-migration-complete`
- [x] **2026-05-25** `blog-ia-redesign` M2 editor lane 已完成：
  - [x] `editor-001 ~ editor-009`：`src/components/editor/round-trip.test.ts` + 8 个 fixture + HTML parity
  - [x] `editor-010 ~ editor-018`：`src/components/editor/MilkdownEditor.test.tsx` + `MilkdownEditor.tsx` 最小交互壳
  - [x] `editor-017`：`playwright.config.ts`、`e2e/editor-mobile.spec.ts`、`/editor-smoke` route 落地并通过 375px overflow e2e
  - [x] 验证：`pnpm vitest run src/components/editor/round-trip.test.ts src/components/editor/MilkdownEditor.test.tsx` => `17 passed`；`pnpm exec playwright test e2e/editor-mobile.spec.ts` => `1 passed`
- [x] **2026-05-25** `blog-ia-redesign` M2 admin-channel 已部分完成：
  - [x] `ach-001 ~ ach-004`：`/admin/channels` page + `ChannelsTable` 列表、上移、enabled toggle、row navigation
  - [x] `ach-005`：`/admin/channels/new` page + `ChannelForm` 6 section shell
  - [x] `ach-006`：`NOTES -> TIMELINE/FEED` 布局联动
  - [x] `ach-007`：`LINKS -> GREP/CARDS` 显式 test/commit 对已回补
  - [x] `ach-008`：`GUESTBOOK` 手动创建提示
  - [x] `ach-009`：`POST /api/admin/channels` duplicate slug -> `409 CONFLICT`
  - [x] `ach-010`：`src/lib/schemas/channel.ts` 建立，slug/kind/layout zod 约束落地
  - [x] `ach-011`：新建频道 submit + `router.push('/admin/channels/<id>/edit')`
  - [x] `ach-012`：`/admin/channels/[id]/edit` 页面与 `ChannelForm` 预填现有值
  - [x] `ach-013`：编辑页保存改走 `PATCH /api/admin/channels/[id]`，layout 修改后 `router.refresh()`
  - [x] `ach-014`：`DELETE /api/admin/channels/[id]` 级联删除 channel / entries / series / translations
  - [x] `ach-015`：`kind=GUESTBOOK` 删除返回 `403 FORBIDDEN`
  - [x] admin-channel 回归：`pnpm vitest run src/app/(admin)/admin/channels/page.test.tsx src/app/(admin)/admin/channels/new/page.test.tsx src/app/(admin)/admin/channels/[id]/edit/page.test.tsx src/app/api/admin/channels/route.test.ts src/app/api/admin/channels/[id]/route.test.ts src/lib/schemas/channel.test.ts` => `16 passed`
- [x] **2026-05-25** `blog-ia-redesign` M2 admin-entry 已启动：
  - [x] `ee-001`：新增 `src/components/admin/entries/EntryEditor.tsx` 与 `/admin/entries/new`，当初始 Channel 为 `ARTICLES` 时 kind dropdown 仅含 `ARTICLE`，Milkdown body 初始为空
  - [x] `ee-002`：`NOTES` channel kind dropdown 显式 coverage 锁定 `NOTE / QUOTE / LINK`
  - [x] `ee-003`：`/admin/entries/new?channelId=<guestbookId>` 返回 `403`；已启用 `next.config.ts experimental.authInterrupts` + `src/app/forbidden.tsx`
  - [x] `ee-004`：`ARTICLE` metadata shell 渲染 `cover / readingMinutes / toc / ogImage`
  - [x] `ee-005`：`LINK` metadata shell 渲染 `sourceUrl / sourceTitle / sourceAuthor / thumbnail`
  - [x] `ee-006`：`HOT_TAKE` metadata shell 渲染 `sourcePlatform / sourceUrl / sourceSnippet`
  - [x] `ee-007`：最小 create draft 链路打通：
    - `src/lib/schemas/entry.ts`：create/update schema
    - `src/lib/services/entries.ts`：`createEntry`（channel-kind guard + metadata parse + tags upsert + draft create）
    - `src/app/api/admin/entries/route.ts`：`POST /api/admin/entries`
    - `src/components/admin/entries/EntryEditor.tsx`：标题 / 摘要 / slug / 保存草稿按钮 + ARTICLE draft POST
  - [x] `ee-008`：新增 `/admin/entries/[id]/edit`、`PATCH /api/admin/entries/[id]`、`updateEntry`；编辑已有 ARTICLE 发布时 `publishedAt` 自动补 now
  - [x] `ee-009`：编辑器能把 `VALIDATION_ERROR.details.issues` 映射成字段级错误
  - [x] `ee-010`：duplicate slug -> `409 CONFLICT`，UI 显示 `slug 已被使用`
  - [x] `ee-011`：`Mod+S` 自动保存时保持当前 status，不把已发布条目改回 `DRAFT`
  - [x] `ee-012`：series dropdown + `seriesOrder` 输入已接入；new/edit page 会传 `seriesOptions`，create payload / DB 都会写 `seriesId + seriesOrder`
  - [x] `ee-013`：`TagsInput` 多选已接入 `EntryEditor`；new/edit page 传 `allTags`；create/update payload 写 `tags`，`TagsOnEntries` 同步
  - [x] `ee-014`：编辑已发布 `ARTICLE` 时显示「归档」按钮；`PATCH` 置 `status=ARCHIVED`
  - [x] `ee-015`：`MilkdownEditor` 拖拽图片走 `POST /api/admin/uploads`，成功后插入 `![alt](url)` markdown
  - [x] admin-entry 当前回归：`pnpm vitest run src/components/admin/entries/EntryEditor.test.tsx src/app/(admin)/admin/entries/new/page.test.tsx src/app/api/admin/entries/route.test.ts src/app/api/admin/entries/[id]/route.test.ts` => `21 passed`

- [x] **2026-05-18** 旧版项目下线 — 远端 `MICBIK/TZBlog` 清空重建为单 empty commit `9d1370c`
- [x] **2026-05-18** 本地工作目录清空（只剩 `.git/`）
- [x] **2026-05-18** 架构访谈 + 提案对齐（5-7 周 MVP，自研 CMS / 自研 Analytics）
- [x] **2026-05-18** AI 开发环境初始化：memory-bank / SDD artifacts / CLAUDE.md / 自定义命令
- [x] **2026-05-18** P0 脚手架完成（5 个 agent 并行）：
  - [x] `pnpm create next-app` + Next.js 16 + TS + Tailwind v4 + Turbopack
  - [x] shadcn/ui 14 个组件 + CSS 变量主题系统（light + dark）
  - [x] Prisma 7 schema（17 张表）+ docker-compose.dev.yml + Postgres 16 (port 5433) + MinIO
  - [x] `prisma migrate dev --name init` 跑通；admin user + SiteConfig singleton 已 seed
  - [x] Auth.js v5 split-config（Edge-safe + Full）+ proxy 守卫
  - [x] Markdown 编辑器 + 服务端 Shiki 渲染管道
  - [x] 自研 lib 全套：errors / api-response / visitor / storage / i18n / rate-limit / env
  - [x] 集成验证：typecheck ✓ / test 26/26 ✓ / build ✓ / dev server 路由全通

### P0 出口标准达成情况

| 标准 | 状态 |
|---|---|
| `pnpm dev` 起来 | ✓ |
| 登录页可访问 | ✓ /login HTTP 200 |
| 未登录访问 /admin → 重定向 /login | ✓ HTTP 307 |
| 未登录访问 /api/admin/* → 401 JSON | ✓ |
| 数据库 schema 落地 | ✓ 17 张表 |
| admin 账号能从 DB 查出 | ✓ admin@tzblog.local |

## 待开始

### P0 脚手架（Week 1）

- [x] `pnpm create next-app@latest` 初始化 + TypeScript / Tailwind / App Router / src/
- [x] `pnpm dlx shadcn@latest init`，配主题 CSS 变量
- [x] 安装 Prisma + 配 `prisma/schema.prisma` 完整 schema
- [x] `docker/docker-compose.dev.yml`（postgres + minio）本地起
- [x] `prisma migrate dev --name init`
- [x] Auth.js v5 + Credentials provider
- [x] admin 账号 seed 脚本
- [x] `src/proxy.ts` 守 `/admin/*` 与 `/api/admin/*`
- [x] P0 阶段曾装 Tiptap + tiptap-markdown 跑通 MD ⇄ ProseMirror 互转；2026-05-23 public-ui-and-editor-overhaul 已替换为 CodeMirror 6 source editor，并删除 Tiptap/lowlight 残留

### P1 后台 CMS（Week 2-3）

- [x] **2026-05-18** 专栏 CRUD 完成（5 个 agent 并行）
  - [x] zod schema + service + REST API（GET/POST list、GET/PATCH/DELETE [id]、POST reorder）
  - [x] 后台列表页（shadcn Table + 上下移按钮 + 操作菜单）
  - [x] 新建/编辑 Dialog（react-hook-form + zod，扁平表单组装为 translations 数组）
  - [x] 公开列表 + 详情页（含 generateMetadata + notFound + 空状态）
  - [x] 测试 60/61 通过（1 skipped — fallback 行为待定）
  - [x] 端到端验证：DB 写入 → 公开页渲染 / 详情页 / 404 全通
- [x] **2026-05-21** 文章列表 + 筛选（专栏/状态/标签/q 搜索）— 代码 P0 阶段已落，本次补齐外围测试覆盖
- [x] **2026-05-21** 文章编辑器页（MarkdownEditorWithPreview + 元数据侧栏 + 草稿/发布/归档动作）— 代码 P0 阶段已落，本次补齐外围测试覆盖
- [x] **2026-05-19** 媒体上传（§1-§7 完成，7.3 S3 切换由用户后续手动验）
  - [x] §1 准备：依赖 `file-type` + `image-size`、`.gitignore` 排除 `/public/uploads/*`、env 加 STORAGE_DRIVER/LOCAL_UPLOAD_DIR/LOCAL_PUBLIC_URL_PREFIX、AdminSidebar 加占位
  - [x] §2 storage-driver：IStorage + LocalDiskStorage + S3Storage（DI 注入 Minio Client）+ env-driven factory + `errors.missingEnv()` fail-fast
  - [x] §3 schemas：mediaFilterSchema + validateUpload（手写 sniffMime 替代 file-type，覆盖 PNG/JPEG/WEBP/GIF）
  - [x] §4 service：createMedia / listMedia / deleteMedia（含 image-size best-effort + 真错误透传修复）
  - [x] §5 API routes：POST /api/admin/uploads + GET /api/admin/media + DELETE /api/admin/media/[id]，10 个微循环（5 个真 RED→GREEN、5 个 pre-covered 衍生）
  - [x] §6 UI 改造：CoverUploader / ImageUploadButton / MediaCard / MediaRowActions / 媒体库列表页 + §6.9 修复 cover schema 接受 `/uploads` 相对路径
  - [x] §7 集成验收：build + manual smoke + SDD verify/archive（STORAGE_DRIVER=s3 切换跳过，用户后续手动验）
- [x] **2026-05-21** 后台文章管理外围测试补齐（codex 任务，主脑审核）
  - API route：`/api/admin/posts/route.test.ts` 12 specs（GET filter ×6 + 401 + POST 创建/409/400/401）+ `/api/admin/posts/[id]/route.test.ts` 11 specs（GET/PATCH/DELETE × 含 404 / 401）
  - 组件 jsdom：`PostsTable.test.tsx` 8 specs（empty / Badge / 标签折叠 / 删除 confirm / 乐观发布 + 回滚 / 分页边界）+ `PostsFilters.test.tsx` 5 specs（debounce 300ms 边界 / Select push / page reset / 重置 / "全部"清空）+ `PostEditor.test.tsx` 7 specs（create+publish 跳转 / 草稿 PATCH / title 空 / slug 非法 / CONFLICT toast / 网络错误 / mode 差异）
  - commit：`6b0f5fb → 504e9ae → 47e44e7 → 9594770 → 004b576`
  - 全量测试：22 files / 213 passed / 1 skipped（基线 170 → 213，+43 specs）
- [x] **2026-05-21** P2 前台展示 D1 — 首页接真实数据 + cover 渲染（KI-002 闭环）
  - SPEC-D1-1 首页 Recent Posts：删 samplePosts，接入 `listPosts({page:1, pageSize:3, status:"PUBLISHED"})`，沿用 `/posts` 列表行风格（`flex-col divide-y`）保持视觉一致
  - SPEC-D1-2 Site Stats：新 service `src/lib/services/stats.ts#getSiteStats`（`sum(viewCount where PUBLISHED)` / `count(post PUBLISHED)` / `count(comment APPROVED)`，Promise.all 并发）
  - SPEC-D1-3 PostCard cover：左缩略图 `aspect-[16/10]`，cover 为 null 不渲染图位；原生 `<img>` + 行级 eslint-disable
  - SPEC-D1-4 详情页 cover：title 上方 hero banner `aspect-[3/1]`，cover 为 null 不渲染
  - 5 个 TDD 微循环 RED→GREEN（commits `667e0e8 → 7281ee8`）+ 1 个 chore 收尾
  - 全量测试：26 files / 221 passed / 1 skipped（基线 213 → 221，+8 specs）
- [x] **2026-05-21** P2 前台展示 D2 — 文章详情 TOC 侧栏
  - SPEC-D2-1..3 `extractToc(content)`：复用 `unified + remarkParse + remarkGfm + remarkRehype + rehypeSlug` 管道前半段 + `rehypeCollectToc` hast visitor，提取 h2/h3 的 `{id, text, level}`，跳过 h1/h4+；id 与 `renderMarkdown` 输出**字面一致**（测试用 regex 守护）
  - SPEC-D2-4..6 `PostToc.tsx` 客户端组件：渲染 `<nav data-testid="post-toc">` + h3 缩进 `pl-3`；`IntersectionObserver` `rootMargin: "-80px 0px -50% 0px"` 高亮 active；unmount 时 `disconnect()`
  - SPEC-D2-7..8 详情页接入：grid 布局 `lg:grid-cols-[minmax(0,1fr)_200px] lg:gap-12`，右侧 `<aside className="hidden lg:block">` + `sticky top-24`；headings 为空时不渲染 aside
  - 3 个 TDD 微循环 RED→GREEN（commits `e9a6287 → 6959d7f`)
  - 全量测试：27 files / 229 passed / 1 skipped（基线 221 → 229，+8 specs）
- [x] **2026-05-21** P2 前台展示 E — RSS / sitemap / OG 图（主体 + §F follow-up 全部落地）
  - SPEC-E-1..2 sitemap：`app/sitemap.ts` 静态路由 + 全部 PUBLISHED post (`lastModified=updatedAt`) + 全部 column；DRAFT/ARCHIVED 排除 + `src/lib/site-meta.ts` (`SITE_META` + `absoluteUrl`)
  - SPEC-E-3..5 feed：`app/rss.xml/route.ts` RSS 2.0 channel + cap 20 (`publishedAt desc`) + XML 5 类预定义实体转义
  - SPEC-E-6..7 og-and-metadata：`app/(site)/posts/[slug]/opengraph-image.tsx` 1200×630 image/png + missing/DRAFT/ARCHIVED → notFound
  - 3 个 TDD 微循环 RED→GREEN（commits `b083b57 → 9321483 → b15e17e → 2741ce8 → 5f35aec → 4c89f10`)
  - 全量测试：31 files / 237 passed / 1 skipped（基线 229 → 237，+8 specs）
  - §F 审计 follow-up：H2 sitemap 全量分页、H3 `robots.ts`、H4 `metadataBase`、M1 Promise params、M2 column locale filter、M3 `revalidate = 600`、M4 RSS atom/self + lastBuildDate、L1/L4/L7 清理（F.7.d priority/changeFrequency 按 optional 跳过）
  - follow-up commits：`6634ee5 → 74a9382 → 58c5c90 → 323198d → 528e23a → ce1ad70 → e64bb3d → bcbcc27 → 113935b → 1986096 → 7fdff94 → b118fe1 → 4fe2f60 → 8e8040b → 488c887`
  - 审计后置 B1（YAGNI 清理）：`listAllPublishedSlugs` 删 dead locale 参数 — commits `4b8a4c5 → 330d343`
  - **SDD 追溯补齐**：原实现绕过 CLAUDE.md TDD 铁律 #2（无 test-map），审计后补齐 `.claude/sdd/seo-and-feed/{proposal.md, specs/{sitemap,feed,og-and-metadata,robots}/spec.md, test-map.md, tasks.md}`
  - **X1/X2 build 阻塞解除**（2026-05-21）：
    - X1 `.env.production AUTH_SECRET < 16 字符` — openssl 旋转到 43 字符 base64，备份 `.env.production.bak`
    - X2 `.env.production DATABASE_URL host=postgres` 本地不可达 — 新建 `.env.production.local` 覆盖 DATABASE_URL=localhost:5433/tzblog（已 .gitignore），VPS 部署不受影响
    - 全量验收：typecheck ✓ / lint ✓ / test ✓ 245 passed / build ✓ 22/22
- [x] **2026-05-21** P2 前台展示 D3 — 评论区 + 点赞（comments-and-likes SDD）
  - SPEC-D3-L-1..4 likes service：`addLike(slug, vh)` 事务 PostLike.create + Post.likeCount+1，P2002 当 idempotent；`hasLikedBy` 查询；NOT_FOUND 守卫
  - SPEC-D3-L-5..7 likes API：`POST/GET /api/posts/[slug]/like`，含 missing slug 404
  - SPEC-D3-L-8 `<LikeButton>`：mount-GET 初态 + 乐观 +1 + POST 成功保留 / 失败回滚 + toast.error
  - SPEC-D3-C-6 `commentCreateSchema`：authorName/email/content/website/parentId 边界 13 用例
  - SPEC-D3-C-1..5+C-7 comments service：createComment 顶层 + 1 层 reply + reply-of-reply 拒绝 + slug/parent NOT_FOUND；listApprovedComments 嵌套 APPROVED-only
  - SPEC-D3-C-8..9 comments API：rate-limit `comment:${vh}` 5min/3，第 4 次 429；GET 仅 APPROVED + 嵌套
  - SPEC-D3-C-10 `<CommentForm>`：react-hook-form + zodResolver + 表单 schema 接受空 website；success / 429 / error 三态 banner
  - SPEC-D3-C-11 `<CommentList>`：顶层 ul + reply `<li data-comment-reply class="pl-8 border-l">` 缩进；顶层「回复」按钮 toggle 内嵌 `<CommentForm parentId>`；reply 自身无按钮
  - SPEC-D3-C-12 PostDetailPage 接入：line 112 计数行 `likes N` → `<LikeButton>`；article 末尾挂 `<CommentSection postId slug>`
  - SDD 全程严格 TDD（scaffold 1 + likes 6 + comments 12 = 19 commit），无追溯补齐，commits `843d2df → 4bf15a8`
  - 全量测试：41 files / 286 passed / 1 skipped（基线 245 → 286，+41 specs）；build 全绿（新增 `/api/posts/[slug]/like`、`/api/posts/[slug]/comments` 路由）
  - 决策记录：R1 永久 unique 点赞（schema 一致 / CLAUDE.md 24h 滚动放弃，待后续 sync 文档），R2 D3 含 1 层 reply（depth=2 限制），R3 honeypot 推 V2，R4 rate-limit 内存版（单 VPS 实例 OK），R5 commentCount 每次插入 +1（含 PENDING）
- [x] **2026-05-21** P1 收尾 — 评论审核页（admin-comments-review SDD）
  - **schema migration**: `Comment.reviewedBy String?` + `reviewedAt DateTime?` + `@@index([status, createdAt])`，migration `20260521132300_add_comment_review_fields`；`reviewedBy` 为 String 兼容 ai-{model}-{ver} marker（R9 决策铺垫 AI 审核）
  - **counter-fix** (R6 修正 D3 R5)：createComment 不再 commentCount +1；updateCommentStatus 流转 +/-（→ APPROVED +1 / APPROVED → 非 -1 / 其他 0）；deleteComment APPROVED -1（含 cascade replies 中 APPROVED count）
  - **review-service** (SPEC-C-V-1..8)：listCommentsForAdmin / updateCommentStatus（含 reviewer 写入 + 幂等 R7）/ bulkUpdateCommentStatus（loop + NOT_FOUND skip）/ deleteComment（cascade replies + 计数器累计）
  - **review-api** (SPEC-C-A-1..5)：3 路由 — `GET /api/admin/comments` (list+filter+pagination) / `PATCH/DELETE /api/admin/comments/[id]` / `POST /api/admin/comments/bulk`；全部 requireAdminSession，未登录 → 401
  - **review-ui** (SPEC-C-U-1..3)：`/admin/comments` page 4 tab + URL sync + 5 路并行 status 计数；`CommentsTable` 含多选 checkbox + 4 行内动作（通过/垃圾/拒绝/删除）+ BulkActions 顶部条 + 乐观更新 + 失败回滚；AdminSidebar link 已 P0 落地（U-4 跳过）
  - SDD 全程严格 TDD（scaffold 1 + 7 个 commit pair + 1 文档同步 = 15 commit），commits `6e81598 → 88cd33e`
  - 决策：R6 仅计 APPROVED / R7 幂等 / R8 真删 / R9 记录 reviewer（兼容 ai-* prefix marker）
- [x] **2026-05-21** P2 收尾 — 自研 Analytics 客户端上报（analytics-beacon SDD）
  - **trackPayloadSchema** (SPEC-A-S-1..3): path `/` 开头 max 500 + referrer optional url-or-empty
  - **recordPageView** (SPEC-A-V-1..2): parseUserAgent → 拆 device/browser/os → db.pageView.create；空字符串 referrer 归 null
  - **POST /api/track** (SPEC-A-A-1..5): DNT 守 → zod.parse → path 黑名单（/admin|/api|/login 正则）→ rate-limit `analytics:${vh}` 60/min → recordPageView → 204
  - **<AnalyticsBeacon>** (SPEC-A-B-1..4): "use client" + usePathname + useEffect + 客户端 DNT/黑名单双守 + sendBeacon-or-fetch keepalive fallback；body `{path, referrer:document.referrer}`
  - **layout 接入** (SPEC-A-L-1): SiteLayout 嵌入 `<AnalyticsBeacon />`，(site) 组所有页面自动上报，(admin) 组不在此 layout 不受影响
  - 决策：R10 不上报 admin（双守）/ R11 不去重（rate-limit 兜底）/ R12 记 referrer（P4 仪表盘需流量来源）/ R14 尊重 DNT（合规预备）
  - SDD `.claude/sdd/analytics-beacon/` 全程严格 TDD（scaffold 1 + 5 commit pair = 11 commit），commits `4900742 → ccab40e`
  - 全量测试：52 files / 352 passed / 1 skipped（基线 329 → 352，+23 specs）；build 全绿（新增 `/api/track` 路由）
  - 不动 Prisma schema（PageView 表 P0 已就绪）；待 P4 后台 Analytics 仪表盘消费数据
- [x] **2026-05-22** 4 SDD 归档后 manual smoke 复验（seo-and-feed / comments-and-likes / admin-comments-review / analytics-beacon）
  - P2-E：sitemap / rss / robots / OG 图（1200×630 PNG）全通过
  - P2-D3：LikeButton 幂等、评论默认 PENDING、PENDING 评论不显示前台
  - P1-C：4 tab + 行内动作 + bulk + DELETE 全通过（行内删除 confirm 因 in-app browser 限制改用 API 旁路验证）
  - P2-A：3 条 PageView 入库（/、post、column），/admin 无埋点，DNT 服务端路径 `curl -H "DNT: 1"` 返回 204 + 计数不变
- [x] **2026-05-22** P1-C 后置 UX patch — 评论删除改 shadcn AlertDialog（解除 in-app browser native dialog 限制）
  - 装 shadcn `alert-dialog` 组件（`radix-ui@1.4.3` umbrella package）
  - `CommentsTable.tsx`：native confirm → 受控 `<AlertDialog open={pendingDelete !== null}>`；保留 cascade replies 提示
  - 测试拆分：原单一 confirm 测试 → 3 个 dialog 交互断言（open / cancel / confirm）
  - commits `c466f52` (test RED) → `593be7f` (feat GREEN, hook ✓ TDD 节奏)
  - 全量测试：52 files / 354 passed / 1 skipped（基线 352 → 354，+2 specs）
  - 后续已补齐：`PostsTable.tsx` / `ColumnsTable.tsx` 也迁移到同款 AlertDialog，删除确认不再依赖浏览器原生弹窗

### P2 前台展示（Week 3-4）

- [x] 首页 Hero + 技术栈 + 最近文章 + GitHub 数据
- [x] 文章详情（Shiki + TOC + 浏览上报 + 点赞 + 评论区）—— D2 (TOC) + D3 (likes/comments) + analytics-beacon (page views) 已分别 archived
- [x] 文章列表 + 专栏聚合页 + 标签页
- [x] RSS / sitemap / OG 图生成（E 主体 + F.1-F.7 follow-up 全部落地，commits `6634ee5 → 8e8040b` + `488c887`）
- [x] 自研 Analytics 客户端上报（`<AnalyticsBeacon>`）—— archive/2026-05-21-analytics-beacon/

### P3 部署上线（Week 5）

- [ ] `Dockerfile`（Next.js standalone，当前 compose 已引用但文件仍缺）
- [x] `docker/docker-compose.yml`（app + postgres + minio + caddy）
- [x] `Caddyfile`（自动 HTTPS + 反代）
- [ ] VPS 配置（Hetzner CX22 或同级）+ 域名解析
- [ ] 备份脚本（Postgres pg_dump + MinIO rclone 同步）
- [ ] 首次上线灰度（先内部访问）

### P4 打磨缓冲（Week 6）

- [x] 自研 Analytics 后台仪表盘
- [ ] Lighthouse 调优（目标桌面 95+ / 移动 90+）
- [x] SEO 元信息 / robots.txt / 站点描述
- [x] README + 部署文档
- [x] **2026-05-23** public-launch-polish 主体：Markdown alerts + `.markdown-body` 阅读系统、首页项目叙事区、About Principles、管理侧边栏 light mode 对比度修复；i18n 当前限制记录为 KI-004，完整迁移进入 V3 独立 SDD
- [x] **2026-05-23** public-ui-and-editor-overhaul 全量完成：Markdown reading / CodeMirror source editor / preview parity、admin readability、首页七段重组、About 八段重组、incomplete pages inventory、i18n single-locale disclosure、light/dark 12 路由浏览器审查、completion report 全部落地；Tiptap/lowlight/mini renderer 残留清零；最终质量门 `typecheck` / `lint` / `test`（116 files / 601 passed / 1 skipped）/ `build` 四绿；editor route client gzip delta 15.0 KiB < 90 KiB；`audit-report.json` 24 entries，P0=0，截图归档到 `.claude/sdd/public-ui-and-editor-overhaul/audit/{light,dark}`。
- [x] **2026-05-24** creative-blog-notion-editor 主体完成：后台文章编辑器切到 `NotionMarkdownEditor` shell（slash command / bubble formatting / media image / Mod-S，保存 Markdown），首页重组为 identity rail + content stream + context rail，文章列表改为高密度 discovery，文章详情加入 editorial shell / right rail / Markdown image frame / `InteractiveExplainer` / TOC progress，前台 motion system 增加共享 tokens、reduced-motion 降级、focus parity 和 SSR 初始可见性契约；全程按 `.claude/sdd/creative-blog-notion-editor/test-map.md` RED/GREEN 微循环提交。
- [x] **2026-05-24** final-experience-hardening 收口完成：
  - seed 脚本写入 3 篇 showcase 文章、2 个专栏、标签、评论和仓库内可追踪展示图片，公开页 smoke 不再依赖 ignored uploads。
  - `/admin/_editor-demo` 改为 `notFound()`；标签索引/详情、本地化后台 Dashboard、编辑器/弹窗 chrome、GitHub fallback 文案全部转为中文单语界面。
  - 质量门：`pnpm typecheck` ✓ / `pnpm lint` ✓ / `pnpm test` ✓（127 files / 629 passed / 1 skipped，仍有已登记 `pg@9` warning）/ `pnpm build` ✓。
  - 浏览器 smoke：seed 后验证 `/`、`/posts`、`/posts/self-hosted-nextjs-observability`、`/columns`、`/tags/nextjs` 的桌面/移动关键路径；无破图、无横向溢出，GitHub fallback 不再出现英文配置提示；截图保存在 `.claude/sdd/final-experience-hardening/smoke/`。
- [x] **2026-05-24** public-layout-rebalance 完成：
  - 新建 `.claude/sdd/public-layout-rebalance/`，补齐 proposal / specs / test-map，并按 TDD 更新 public shell 与文章详情/归档页布局断言。
  - `(site)` 公共 shell、Header、Footer 从 `max-w-3xl` 升到 `max-w-7xl`；文章、专栏、标签等归档页使用 `max-w-6xl` 内层画布，专栏/标签索引桌面提升到三列。
  - 文章详情 shell 改为 `xl` 才启用 TOC rail，桌面正文列扩到约 `844-860px`；移动端保持单列且无横向溢出。
  - 发布态文章会在 `renderMarkdown` / `extractToc` 前去掉与 CMS 标题完全重复的首个 Markdown `#`，避免页面出现双 H1。
  - 质量门：`pnpm typecheck` ✓ / `pnpm lint` ✓ / `pnpm test` ✓（129 files / 637 passed / 1 skipped）/ `pnpm build` ✓。
  - 浏览器复验：`/`、`/posts`、`/posts/self-hosted-nextjs-observability`、`/columns`、`/tags`、`/tags/nextjs`、`/about` 的桌面/移动视口均无横向溢出；文章详情桌面正文列约 `844px`、右 rail `300px`，移动端仅保留单一 H1。
- [x] **2026-05-24** admin-editor-shell-repair 完成：
  - 新建 `.claude/sdd/admin-editor-shell-repair/`，补齐 proposal / specs / test-map，并用组件测试锁定 editor shell、slash command 和媒体插入行为。
  - `NotionMarkdownEditor` 不再是裸 `textarea`：补上全宽写作画布、稳定最小高度、可读排版、命令菜单/格式 toolbar 的基础 chrome，并给空文档补了 starter actions 与可点击的 `/ 命令` 入口。
  - slash command 和媒体插入改为按当前光标 / trigger range 插入，不再覆盖整篇内容；slash menu 支持 query 过滤、方向键切换和 Enter 确认；`PostEditor` 集成提交流程保持 Markdown 原样输出。
  - 后台窄屏布局同步收口：sidebar 收成 compact rail，header breadcrumb 改成 truncate，文章编辑页 sticky toolbar spacing 不再制造横向溢出。
  - 质量门：`pnpm typecheck` ✓ / `pnpm lint` ✓ / `pnpm test` ✓（129 files / 642 passed / 1 skipped）/ `pnpm build` ✓。
  - 浏览器复验：`/admin/posts/new` 当前 in-app 桌面视口下 editor shell 宽度约 `648px`，无横向溢出；真实交互验证通过 starter action 插入、可点击 `/ 命令` 入口、`ArrowDown + Enter` 命令选择和 `/table` query 过滤插入。
- [x] **2026-05-24** block-markdown-shell 完成：
  - 新建 `.claude/sdd/block-markdown-shell/`，补齐 proposal / specs / test-map，并新增 `notionBlockModel` 单元测试锁定 Markdown → blocks → Markdown round trip。
  - `NotionMarkdownEditor` 从单一 command-style textarea shell 提升为 block-based Markdown shell：标题、段落、列表、引用、提示块、代码块、表格、图片和 raw fallback 块都有独立编辑表面。
  - 空文档保留 starter actions；块级新增按钮可创建新段落；第二块中的 slash query 过滤和 Enter 选择在真实浏览器里可用。
  - 质量门：`pnpm typecheck` ✓ / `pnpm lint` ✓ / `pnpm test` ✓（130 files / 647 passed / 1 skipped）/ `pnpm build` ✓。
  - 浏览器复验：全新 `/admin/posts/new` tab 中，starter action 先落成 `heading2`，随后新增第二块、输入 `/table` 后菜单只剩表格，回车后页面块序列为 `heading2 + table`，且无横向溢出。

## V2 backlog（MVP 上线后，独立 SDD）

- [ ] 主题系统 GUI（后台编辑色板 + 一键切换 + 多套预设主题）
- [ ] 详细 Analytics（来源 / 设备 / 国家 / 对比 / 导出）
- [ ] 评论邮件通知（被回复时邮件）
- [ ] 编辑器增强：表格 / 脚注 / 数学公式 / 拖拽上传图片；保持 Markdown persistence + shared `renderMarkdown` publish/parity 契约，不恢复 mini renderer，不引入未通过 adapter 证据门的私有 JSON/block schema
- [ ] 文章展示增强：真实示例内容、首页/文章页截图资产、OG 视觉统一、Lighthouse 后续微调

## V3 backlog（MVP 上线后，独立 SDD）

- [ ] 多语言（zh / en） — V3 独立 SDD `i18n-locale-routing-v3`：Next.js App Router locale routing（建议 `app/[lang]`）、Header 语言切换器、dictionary 静态文案、en 翻译数据、metadata / RSS / sitemap / canonical / alternate links 全链路 locale-aware
- [ ] i18n 数据流迁移：`getCurrentLocale()` 不再固定返回 zh，改由 route params / proxy negotiation / cookies 明确注入；所有 public services、SEO/feed、OG 图和列表页统一从当前 locale 读取

V2/V3 不属于本轮 prelaunch-readiness；涉及 DB/UI/API/邮件/路由结构时必须分别开独立 SDD。

## 技术债务

> 上线后产生的取舍记录都进这里

- **2026-05-21** `pg@9` deprecation warning：测试运行时 `Calling client.query() when the client is already executing a query is deprecated and will be removed in pg@9.0`。当前 `pg@8.21`，不阻塞 test/build。pg 升 9 时一并改异步流。
- **2026-05-21** `PostsFilters` URL canonical 行为不写 `page=1`（`filterToSearchParams` 显式跳过）。codex 补外围测试时按此实际行为测；如未来需要在 URL 显式带 `page=1`，需同步改实现 + 测试期望。
- **2026-05-21** 前台 cover 用原生 `<img>` + 行级 `eslint-disable @next/next/no-img-element`，未走 `next/image`。原因：MinIO/local 双 storage driver 的 URL 模式动态切换，配 `next.config.ts#images.remotePatterns` 噪音大。未来如接 CDN 或决定单一 driver 时再换 `next/image`。
- **2026-05-23** `prelaunch-readiness` 清理：Next proxy 入口、Prisma preview flag、About/TechStack 上线文案、README/AGENTS/CLAUDE/docs/memory-bank 当前事实已同步。后续若继续改编辑器底层实现，单开 editor-source-mode SDD。
- **2026-05-23** KI-004 多语言当前仍是架构预留：schema 有 `*Translation` 子表和 `SUPPORTED_LOCALES`，但当前实现仍是单 locale；V3 需要独立 SDD 完成 route/dictionary/metadata/RSS/sitemap 全链路迁移。
- **2026-05-24** creative-blog-notion-editor 收口：`NotionMarkdownEditor` 当前是轻量 Markdown shell，不引入 Novel/Tiptap/MDXEditor runtime 依赖；后续若真正接入第三方 rich/block editor，必须先跑 `notionEditorAdapter` round-trip/parity 证据门，并复核 admin editor route-specific client delta。
- **2026-05-24** 展示 seed 策略：用于前台 smoke 的文章、专栏和 Markdown 图片必须引用仓库内可追踪资产（当前为 `public/showcase/*`），不要依赖 `.gitignore` 的 `public/uploads/*`，避免干净环境出现破图或空白首页。
- **2026-05-24** 本地测试与 smoke 仍共用 `DATABASE_URL`：运行 `pnpm test` 会清空 showcase 数据，之后若要做浏览器 smoke 必须先执行 `pnpm db:seed`。长期方案应拆出独立 test DB / `.env.test`，避免测试污染本地演示环境。


## 度量指标

| 指标 | 目标 | 现状 |
|---|---|---|
| MVP 上线 | 2026-06-29（Week 6 末） | P2/P4 主体完成，P3 部署与展示打磨未闭环 |
| Lighthouse 桌面 | ≥95 | 待线上/production smoke 后测 |
| Lighthouse 移动 | ≥90 | 待线上/production smoke 后测 |
| 自研 Analytics 替代 Umami | 100% | 客户端上报 + 后台基础仪表盘已落地，待生产数据验证 |
