# Active Context — TZBlog

> 当前正在做什么 / 下一步是什么。每次会话结束前应该是最新的。

## 当前焦点

**P0 脚手架已完成（2026-05-18）**：
- Next.js 16.2.6 + React 19 + TypeScript 5 + Tailwind v4 + Turbopack 初始化完成
- shadcn/ui 14 个组件就位（button/input/label/card/dialog/dropdown/form/table/select/separator/textarea/tabs/sonner/badge）
- CSS 变量主题系统按 systemPatterns §8 落地（light + dark）
- Prisma 7.8 schema 完整：17 张表（含 Auth.js v5 的 Account/Session/VerificationToken）
- Postgres 16 + MinIO 通过 Docker Compose 跑通；migrate + seed 全打通
- Auth.js v5 split-config 模式：`auth.config.ts`（Edge-safe）+ `auth.ts`（PrismaAdapter + Credentials + bcryptjs）
- middleware 守 `/admin/*` 与 `/api/admin/*` — 实测 307 重定向 / 401 JSON 响应符合契约
- Tiptap WYSIWYG + tiptap-markdown 编辑器组件 + 服务端 Shiki 渲染管道（remark/rehype）就位
- 自研 lib：errors / api-response / visitor (sha256 指纹) / storage (MinIO) / i18n / rate-limit / env (zod 校验)

**实测验证**：
- `pnpm typecheck` ✓
- `pnpm test` 26/26 ✓
- `pnpm build` ✓ (9 routes, 1 dynamic /admin)
- `pnpm dev` ✓ — `/`、`/login` 200；`/admin` 307→login；`/api/admin/*` 401 JSON
- DB seed: admin@tzblog.local + SiteConfig singleton 已写入

## 关键端口

- Postgres：**5433**（5432 被本机其他容器占用，本项目用 5433）
- MinIO API：9000，Console：9001
- Next.js dev：3000

## 下一步计划

**P1 后台 CMS（Week 2-3）** — 优先顺序：
1. 后台 layout 美化（用上 shadcn 组件，去掉占位 token 直引）
2. 专栏 CRUD（最简：列表 + 新建/编辑 Dialog）
3. 文章列表（Table + 分页 + 状态筛选）
4. 文章编辑器页（接入 MarkdownEditorWithPreview + 元数据侧栏）
5. 媒体上传（先本地，P3 接 MinIO）
6. 评论审核页（Tabs + 批量操作）

**建议从「专栏 CRUD」起步**，因为它的 schema 最简单，能跑通整套：
zod schema → API route + withErrorHandler → server actions → form 表单 → service 层。
跑通后文章 CRUD 照模式扩展即可。

## 关键决策（已锁定）

| 决策 | 选择 |
|---|---|
| 应用形态 | 单体 Next.js |
| 框架 | Next.js 16 (App Router) |
| DB / ORM | Postgres 16 + Prisma 7（driver adapter @prisma/adapter-pg）|
| UI | shadcn/ui + Tailwind v4 + CSS 变量 |
| 编辑器 | Tiptap WYSIWYG + Markdown 序列化 |
| 认证 | Auth.js v5 split-config（Edge-safe + Full）|
| 媒体 | MinIO |
| 部署 | VPS + Docker Compose + Caddy |
| 分析 | 自研（无第三方）|
| 评论 | 匿名 + 后台审核 |
| i18n | schema 预留 *Translation 子表 |

## 注意事项 / 偏离记录

- **Prisma 7 driver adapter 模式**：schema.prisma 内不再写 datasource.url；运行期 `src/lib/db.ts` 用 `@prisma/adapter-pg`；migrate/introspect 走 `prisma.config.ts` 的 datasource.url（dotenv 主动加载）
- **Next.js 16 中间件 deprecation**：构建会报 `middleware.ts` deprecated → 应改名 `proxy.ts`，但功能正常工作。计划在 P1 早期处理
- **Tiptap markdown pipeline 简化**：`MarkdownEditorWithPreview` 客户端预览用了 mini-renderer（待 V2 接 marked + DOMPurify 完整化），完整 remark+shiki 已落到服务端 `MarkdownPreview`
- **rehype-shiki 替换**：原计划的 `rehype-shiki@0.0.9` 与 shiki@4 不兼容，改成内联 transformer 调用 `createHighlighter` + `codeToHast`

## 待用户决策（不阻塞 P1）

- VPS 实际购买（推荐 Hetzner CX22，部署阶段前定）
- 域名（部署前定）

## 阻塞项

无。

