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
- [ ] 文章列表 + 筛选（专栏/状态/标签）
- [ ] 文章编辑器页（接入 MarkdownEditorWithPreview + 元数据侧栏)
- [/] **2026-05-19** 媒体上传（§1-§6 完成，§7 验收待做）
  - [x] §1 准备：依赖 `file-type` + `image-size`、`.gitignore` 排除 `/public/uploads/*`、env 加 STORAGE_DRIVER/LOCAL_UPLOAD_DIR/LOCAL_PUBLIC_URL_PREFIX、AdminSidebar 加占位
  - [x] §2 storage-driver：IStorage + LocalDiskStorage + S3Storage（DI 注入 Minio Client）+ env-driven factory + `errors.missingEnv()` fail-fast
  - [x] §3 schemas：mediaFilterSchema + validateUpload（手写 sniffMime 替代 file-type，覆盖 PNG/JPEG/WEBP/GIF）
  - [x] §4 service：createMedia / listMedia / deleteMedia（含 image-size best-effort + 真错误透传修复）
  - [x] §5 API routes：POST /api/admin/uploads + GET /api/admin/media + DELETE /api/admin/media/[id]，10 个微循环（5 个真 RED→GREEN、5 个 pre-covered 衍生）
  - [x] §6 UI 改造：CoverUploader / ImageUploadButton / MediaCard / MediaRowActions / 媒体库列表页 + §6.9 修复 cover schema 接受 `/uploads` 相对路径
  - [ ] §7 集成验收：build + manual smoke + STORAGE_DRIVER=s3 切换 + /opsx:verify + /opsx:archive
- [ ] 评论审核页（pending/approved/spam/rejected 标签 + 批量操作）

### P2 前台展示（Week 3-4）

- [ ] 首页 Hero + 技术栈 + 最近文章 + GitHub 数据
- [ ] 文章详情（Shiki + TOC + 浏览上报 + 点赞 + 评论区）
- [ ] 文章列表 + 专栏聚合页 + 标签页
- [ ] RSS / sitemap / OG 图生成
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

_暂无_

## 度量指标

| 指标 | 目标 | 现状 |
|---|---|---|
| MVP 上线 | 2026-06-29（Week 6 末） | _未开始_ |
| Lighthouse 桌面 | ≥95 | _未上线_ |
| Lighthouse 移动 | ≥90 | _未上线_ |
| 自研 Analytics 替代 Umami | 100% | _未上线_ |
