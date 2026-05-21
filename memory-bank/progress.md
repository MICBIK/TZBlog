# Progress — TZBlog

## 已完成

- [x] **2026-05-18** 旧版项目下线 — 远端 `MICBIK/TZBlog` 清空重建为单 empty commit `9d1370c`
- [x] **2026-05-18** 本地工作目录清空（只剩 `.git/`）
- [x] **2026-05-18** 架构访谈 + 提案对齐（5-7 周 MVP，自研 CMS / 自研 Analytics）
- [x] **2026-05-18** AI 开发环境初始化：memory-bank / openspec / CLAUDE.md / 自定义命令
- [x] **2026-05-18** P0 脚手架完成（5 个 agent 并行）：
  - [x] `pnpm create next-app` + Next.js 16 + TS + Tailwind v4 + Turbopack
  - [x] shadcn/ui 14 个组件 + CSS 变量主题系统（light + dark）
  - [x] Prisma 7 schema（17 张表）+ docker-compose.dev.yml + Postgres 16 (port 5433) + MinIO
  - [x] `prisma migrate dev --name init` 跑通；admin user + SiteConfig singleton 已 seed
  - [x] Auth.js v5 split-config（Edge-safe + Full）+ middleware 守卫
  - [x] Tiptap WYSIWYG 编辑器 + 服务端 Shiki 渲染管道
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
- [x] `src/middleware.ts` 守 `/admin/*` 与 `/api/admin/*`
- [x] Tiptap + tiptap-markdown 装好，跑通 MD ⇄ ProseMirror 互转

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
  - [x] §7 集成验收：build + manual smoke + /opsx:verify + /opsx:archive（STORAGE_DRIVER=s3 切换跳过，用户后续手动验）
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
  - 全量测试：47 files / 329 passed / 1 skipped（基线 286 → 329，+43 specs）；build 全绿（新增 `/admin/comments` + `/api/admin/comments/*` 含 `bulk`）

### P2 前台展示（Week 3-4）

- [ ] 首页 Hero + 技术栈 + 最近文章 + GitHub 数据
- [ ] 文章详情（Shiki + TOC + 浏览上报 + 点赞 + 评论区）
- [ ] 文章列表 + 专栏聚合页 + 标签页
- [x] RSS / sitemap / OG 图生成（E 主体 + F.1-F.7 follow-up 全部落地，commits `6634ee5 → 8e8040b` + `488c887`）
- [ ] 自研 Analytics 客户端上报（`<AnalyticsBeacon>`）

### P3 部署上线（Week 5）

- [ ] `Dockerfile`（Next.js standalone）
- [ ] `docker/docker-compose.yml`（app + postgres + minio + caddy）
- [ ] `Caddyfile`（自动 HTTPS + 反代）
- [ ] VPS 配置（Hetzner CX22 或同级）+ 域名解析
- [ ] 备份脚本（Postgres pg_dump + MinIO rclone 同步）
- [ ] 首次上线灰度（先内部访问）

### P4 打磨缓冲（Week 6）

- [ ] 自研 Analytics 后台仪表盘（UV/PV + 7 天折线 + 热门 Top 10）
- [ ] Lighthouse 调优（目标桌面 95+ / 移动 90+）
- [ ] SEO 元信息 / robots.txt / 站点描述
- [ ] README + 部署文档

## V2 路线（MVP 上线后）

- [ ] 主题系统 GUI（后台编辑色板 + 一键切换 + 多套预设主题）
- [ ] 详细 Analytics（来源 / 设备 / 国家 / 对比 / 导出）
- [ ] 评论邮件通知（被回复时邮件）
- [ ] 编辑器增强：表格 / 脚注 / 数学公式 / 拖拽上传图片

## V3 路线

- [ ] 多语言（zh / en） — 路由 `/en/...` + Header 切换器 + en 翻译数据

## 技术债务

> 上线后产生的取舍记录都进这里

- **2026-05-21** `pg@9` deprecation warning：测试运行时 `Calling client.query() when the client is already executing a query is deprecated and will be removed in pg@9.0`。当前 `pg@8.21`，不阻塞 test/build。pg 升 9 时一并改异步流。
- **2026-05-21** `PostsFilters` URL canonical 行为不写 `page=1`（`filterToSearchParams` 显式跳过）。codex 补外围测试时按此实际行为测；如未来需要在 URL 显式带 `page=1`，需同步改实现 + 测试期望。
- **2026-05-21** 前台 cover 用原生 `<img>` + 行级 `eslint-disable @next/next/no-img-element`，未走 `next/image`。原因：MinIO/local 双 storage driver 的 URL 模式动态切换，配 `next.config.ts#images.remotePatterns` 噪音大。未来如接 CDN 或决定单一 driver 时再换 `next/image`。


## 度量指标

| 指标 | 目标 | 现状 |
|---|---|---|
| MVP 上线 | 2026-06-29（Week 6 末） | _未开始_ |
| Lighthouse 桌面 | ≥95 | _未上线_ |
| Lighthouse 移动 | ≥90 | _未上线_ |
| 自研 Analytics 替代 Umami | 100% | _未上线_ |
