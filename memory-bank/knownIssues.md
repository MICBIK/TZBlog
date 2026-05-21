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

## KI-003 SEO/feed 套件审计 follow-up（HIGH/MEDIUM/LOW 缺口）

- **首次发现**：2026-05-21（P2-E 审计阶段）
- **背景**：commits `b083b57..4c89f10` 落 SPEC-E-1..7 实现绿后审计发现 4 个 HIGH + 4 个 MEDIUM + 4 个 LOW 缺口。详细修复方案见 `.claude/sdd/seo-and-feed/tasks.md §F`。
- **现象 / 影响范围**：

  | 级别 | ID | 现象 | 风险 |
  |---|---|---|---|
  | HIGH | H2 | `sitemap.ts:10` `pageSize: 1000` 绕过 `postFilterSchema.pageSize.max(100)` zod 限制 | 文章数 > 1000 时 sitemap 静默截断，SEO 失效 |
  | HIGH | H3 | `src/app/robots.ts` 缺失（SDD 占位但未实现） | 爬虫需手动猜 sitemap.xml 路径，部分爬虫不会自动尝试 |
  | HIGH | H4 | `app/layout.tsx` 缺 `metadataBase` | OG 图相对 URL 拼接不可靠，Next.js 运行时 warn |
  | MEDIUM | M1 | `opengraph-image.tsx:9` `Props.params` union `{slug} \| Promise<{slug}>` 是兼容 shim | 违反 CLAUDE.md "禁兼容 shim"，测试用同步对象掩盖 Next 15 Promise 形状 |
  | MEDIUM | M2 | `sitemap.ts:11` `listColumns()` 未按 locale 过滤 | 无 zh 翻译的 column 出现在 sitemap 但前台 404 |
  | MEDIUM | M3 | rss/sitemap 缺 `revalidate` 缓存 | 爬虫高频访问每次打 DB |
  | MEDIUM | M4 | RSS 缺 `<atom:link rel="self">` + `<lastBuildDate>` | W3C feed validator 会标记 |
  | LOW | L1 | `route.ts:11` `posts.items.slice(0, 20)` 冗余 | 代码冗余 |
  | LOW | L2 | OG image 三处 hardcode 色值 | 色值散落 |
  | LOW | L3 | sitemap 缺 `priority` / `changeFrequency` | 非必须 |
  | LOW | L4 | `src/lib/seo/` 空目录 | 死代码 |

- **临时解法**：无（实现已部署本地，未合并 main）。当前主分支领先 origin 77 commits，未推送。
- **永久解法**：见 `.claude/sdd/seo-and-feed/tasks.md §F.1-F.7`，每条挂 [TEST-RED] + [IMPL-GREEN] 微循环。
- **ha1den decision pending**：合并策略 — 选 A 合到当前 SDD（推荐）、选 B 独立 SDD、选 C 直接合 main 留 KI 待办。
- **不修原因（当前阶段）**：实现 PASS 后审计立即补 SDD 追溯文档，follow-up 等用户决策合并策略。

## KI-002 `Post.cover` 前台未渲染 — RESOLVED 2026-05-21

- **首次发现**：2026-05-21（P1-3 媒体上传 §7 smoke）
- **现象**：后台可上传并保存 `/uploads/...` 到 `Post.cover`，但前台 `/posts` 列表与 `/posts/[slug]` 详情页均不渲染。
- **影响范围**：P1-3 验收矩阵 K（"删除被引用封面后前台破图"）不可观测。
- **解法**：D1 在 `PostCard`（左缩略图 `aspect-[16/10]`）与详情页 header（hero banner `aspect-[3/1]`）接入 `Post.cover` 渲染；cover 为 `null` 或空串时整个图位不渲染，无破图占位。原生 `<img>` + 行级 `eslint-disable @next/next/no-img-element`（暂不接 next/image，避开 MinIO/local 双 driver 的 `remotePatterns` 配置）。
- **闭环 commits**：`163e281 → 51922b1 → 5cf5c6e → 7281ee8`
