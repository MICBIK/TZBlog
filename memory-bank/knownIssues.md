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

## KI-002 `Post.cover` 前台未渲染

- **首次发现**：2026-05-21（P1-3 媒体上传 §7 smoke）
- **现象**：后台文章编辑器可通过 `CoverUploader` 上传并保存 `/uploads/...` 到 `Post.cover`，删除对应 Media 行后 DB 中 `Post.cover` 会按预期保留悬空路径；但 `/posts` 列表与 `/posts/[slug]` 详情页当前都不渲染 `Post.cover`，因此无法在前台观察到验收矩阵 K 期望的破图。
- **影响范围**：P1-3 媒体上传的“删除被引用封面后前台破图”smoke 不可观测；上传、保存、删除和 DB 悬空引用本身可验证。
- **临时解法**：§7 v2 跳过 K，用本条记录进入待办池。
- **永久解法**：P2 前台展示阶段在文章列表卡片 / 文章详情页接入 `Post.cover` 渲染，并定义图片缺失时的降级 UI。
- **不修原因（当前阶段）**：用户明确要求本轮不修 `Post.cover` 前台渲染，留到 P2 处理。
