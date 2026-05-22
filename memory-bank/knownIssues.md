# Known Issues — TZBlog

> 已知问题 / 临时绕过 / 未解决的坑。每个条目应该有：现象 / 影响范围 / 临时解法 / 永久解法或 TODO 链接。

## KI-001 登录表单 zodResolver 拒 `.local` TLD

- **首次发现**：2026-05-19（§6 媒体上传 manual smoke 期间）
- **现象**：`src/lib/schemas/auth.ts:4` 用 `z.string().email("Invalid email address")`，Zod 的 email 校验默认拒 `.local` 这种非顶级 TLD。本地 `.env` 的 `ADMIN_EMAIL=admin@tzblog.local`（P0 seed 产物）走登录表单时被前端 zodResolver 直接拦下，连请求都发不出去。
- **影响范围**：仅本地开发；生产环境的 ADMIN_EMAIL 是真实域名不受影响。
- **临时解法**：seed 一个备用 admin `admin@example.com` 用于本地 smoke（与 `.env.example` 一致），原 `admin@tzblog.local` 留着但不走 UI 登录。
- **永久解法（候选）**：
  - 选 A：放宽 schema 为 `z.string().min(3).includes("@")`，把"是不是合法邮箱"的判断完全交给服务端 + 数据库的 UNIQUE 约束（推荐 — 邮箱本来就不该被前端这么严格地校验）。
  - 选 B：保持 schema 不变，改 P0 seed 默认 admin 邮箱为 `admin@example.com` 以保持本地/示例一致。
- **不修原因（当前阶段）**：脱离 P1-3 媒体上传范围；用户已用绕过方案完成 smoke。留待 P1 文章 CRUD / 评论审核期间顺手收口，或单开一个 `auth-email-validation` change。

## KI-003 SEO/feed 套件审计 follow-up — RESOLVED 2026-05-21

- **首次发现**：2026-05-21（P2-E 审计阶段）
- **背景**：commits `b083b57..4c89f10` 落 SPEC-E-1..7 实现绿后，审计发现 sitemap / robots / metadataBase / RSS validator / cache 等缺口。
- **解法**：§F follow-up 已落地：`robots.ts`、root `metadataBase` + OpenGraph 默认值、OG Promise params、sitemap `listAllPublishedSlugs` 全量分页、column locale filter、sitemap/RSS `revalidate = 600`、RSS `atom:link` + `lastBuildDate`、删除 RSS 冗余 slice。`src/lib/seo/` 是未跟踪空目录，已本地 `rmdir`；F.7.d `priority/changeFrequency` 为 optional，本轮按 brief 跳过。
- **闭环 commits**：`6634ee5 → 74a9382 → 58c5c90 → 323198d → 528e23a → ce1ad70 → e64bb3d → bcbcc27 → 113935b → 1986096 → 7fdff94 → b118fe1 → 4fe2f60 → 8e8040b → 488c887`

## KI-002 `Post.cover` 前台未渲染 — RESOLVED 2026-05-21

- **首次发现**：2026-05-21（P1-3 媒体上传 §7 smoke）
- **现象**：后台可上传并保存 `/uploads/...` 到 `Post.cover`，但前台 `/posts` 列表与 `/posts/[slug]` 详情页均不渲染。
- **影响范围**：P1-3 验收矩阵 K（"删除被引用封面后前台破图"）不可观测。
- **解法**：D1 在 `PostCard`（左缩略图 `aspect-[16/10]`）与详情页 header（hero banner `aspect-[3/1]`）接入 `Post.cover` 渲染；cover 为 `null` 或空串时整个图位不渲染，无破图占位。原生 `<img>` + 行级 `eslint-disable @next/next/no-img-element`（暂不接 next/image，避开 MinIO/local 双 driver 的 `remotePatterns` 配置）。
- **闭环 commits**：`163e281 → 51922b1 → 5cf5c6e → 7281ee8`

## KI-004 多语言当前仍是单 locale 架构预留

- **首次发现**：2026-05-23（public-launch-polish 审计）
- **现象**：`SUPPORTED_LOCALES = ["zh", "en"]` 和 Prisma `*Translation` 子表已经存在，但当前实现仍是单 locale：`getCurrentLocale()` 固定返回 `zh`，public routes 没有 `app/[lang]`，Header 没有语言切换，静态 UI copy 没有 dictionary，metadata / RSS / sitemap / OG 图也没有 locale-aware 输出。
- **影响范围**：不能宣称站点已支持 zh/en 多语言；英文内容、SEO alternate links、RSS/sitemap、canonical、分享图都会停留在 zh 单一路径语义。
- **临时解法**：MVP 继续作为中文单语言站点上线，数据模型保留 en 翻译能力但不暴露伪多语言入口。
- **永久解法**：V3 独立 SDD，按 Next.js App Router locale routing 迁移 public route tree（建议 `app/[lang]`），引入 dictionary，改 `getCurrentLocale()` 从 route params / proxy negotiation / cookies 注入，补齐 metadata / RSS / sitemap / canonical / alternate links，逐页回归服务端数据查询 locale 来源。
