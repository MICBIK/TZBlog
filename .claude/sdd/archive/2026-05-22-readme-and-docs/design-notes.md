# design-notes — readme-and-docs

## README 完整骨架（直接套用，按需调整）

```markdown
# TZBlog

> 自研个人技术博客。Next.js 15 + Postgres + 自部署。

<!-- TODO[post-launch]: replace with real screenshot -->
<p align="center"><img alt="TZBlog homepage" src="docs/assets/screenshot-home.png" width="720" /></p>

## 介绍

TZBlog 是一个单体 Next.js 15 应用，包含：

- 前台 — Editorial 风格的内容展示（首页、文章、专栏、标签、About）
- 后台 CMS — Markdown WYSIWYG（Tiptap）、媒体管理、评论审核
- 自研 Analytics — PageView / 设备 / 流量来源 dashboard
- 自部署 — Docker Compose + Caddy + 自有 VPS（不依赖 Vercel）

## 技术栈

| 类别 | 选型 |
|------|------|
| 框架 | Next.js 15 (App Router / RSC / Server Actions) |
| 语言 | TypeScript 5 (strict) |
| 数据库 | PostgreSQL 16 + Prisma 5 |
| UI | Tailwind CSS v4 + shadcn/ui + Radix |
| 编辑器 | Tiptap v2 + tiptap-markdown |
| 渲染 | remark + rehype + Shiki |
| 认证 | Auth.js v5 (Credentials) |
| 媒体 | MinIO (S3 协议) |
| 测试 | Vitest + @testing-library/react |
| 部署 | Docker Compose + Caddy (auto HTTPS) |

## 快速开始

```bash
pnpm install
cp .env.example .env       # 修改 DATABASE_URL / NEXTAUTH_SECRET 等
pnpm docker:dev            # 启动 local Postgres + MinIO
pnpm db:migrate
pnpm db:seed               # 可选：种子数据
pnpm dev
```

打开 http://localhost:3000 。

详细 setup 见 [`docs/development.md`](docs/development.md)。

## 项目结构

```
src/
├── app/(site)/         # 前台公开页（无认证）
├── app/(admin)/        # 后台 CMS（middleware 守）
├── app/api/            # REST API
├── components/         # UI 组件
├── lib/services/       # 业务 service 层（跨表流程）
├── lib/schemas/        # zod schema（前后端共享）
└── middleware.ts       # /admin / /api/admin 守卫

prisma/                 # schema + migrations + seed
docker/                 # docker compose 文件
docs/                   # 详细文档
.claude/sdd/            # Spec-Driven Development artifacts
memory-bank/            # 项目上下文
```

## 约定

- **Commit**：Conventional Commits + scope，例：`feat(post-detail): SPEC-X-1 ...`
- **TDD**：每微循环两提交 `test(scope): SPEC RED` → `feat(scope): SPEC GREEN`
- **SDD**：变更前在 `.claude/sdd/<feature>/` 写 proposal / specs / test-map / tasks，再开工
- **NO-TDD 例外**：仅 *.md / *.css 等纯文档/样式，commit 必须带 `[no-tdd]` 标签
- husky `commit-msg` hook 自动校验

详见 [`docs/conventions.md`](docs/conventions.md)。

## 部署

自部署到 VPS，步骤：

```bash
docker compose up -d
docker compose exec app pnpm db:migrate
docker compose exec app pnpm db:seed   # 首次
```

Caddy 自动签 HTTPS。详细见 [`docs/deployment.md`](docs/deployment.md)。

## License

MIT © 2026 ha1den
```

## docs/architecture.md 骨架

```markdown
> Last verified: 2026-05-22

# 架构概览

## 路由组

| 组 | 路径 | 守卫 |
|----|------|------|
| `(site)` | `/`, `/posts/*`, `/columns/*`, `/tags/*`, `/about` | 公开 |
| `(admin)` | `/admin/*` | middleware (Auth.js session) |
| `api/` | `/api/*` | 仅 `/api/admin/*` 守 |

## 数据访问

Server Component 直接 `await db.x.findMany(...)`，不包装无意义 service 层。

只有跨多表的业务流程才放 `src/lib/services/*.ts`（如 createPost 同时写 PostTranslation + TagsOnPosts）。

**不写 Repository 模式**。

## API 响应格式

成功：`{ data: T, meta?: {...} }`
失败：`{ error: { code: string, message: string, details?: object } }`

## Auth (Auth.js v5)

Credentials provider，bcrypt 密码哈希，session 由 middleware 守 `/admin` 和 `/api/admin`。

## 主题变量

所有颜色用 CSS 变量：`color: hsl(var(--fg))`。变量定义在 `src/app/globals.css` 的 `@theme` 块。**禁止硬编码色值**。

常用语义：`--bg / --fg / --muted / --accent / --border / --ring`。

## i18n

内容字段抽到 `*Translation` 子表，按 `(parentId, locale)` 唯一。查询时 `where: { locale: currentLocale }`。MVP 写死 `"zh"`。

## 计数器

`Post` 内嵌 `viewCount / likeCount / commentCount`。写入时事务内 `count = count + 1`。详情表（PostView / PostLike / Comment）保留原始数据用于去重。

## 反垃圾

`visitorHash = sha256(ip + userAgent + dailySalt)`

- 浏览去重：同 visitor + 同文章 + 同天
- 点赞：同 visitor + 同文章 24h
- 评论：同 visitor 5min 内最多 3 条
```

## docs/deployment.md 骨架（要点）

```markdown
> Last verified: 2026-05-22

# 部署

## 前置

- VPS (Ubuntu 22.04+)
- Docker 24+ / Docker Compose v2
- 域名 + DNS A record 指向 VPS IP

## env

复制 `.env.example` → `.env.production`：

```env
DATABASE_URL=postgresql://tzblog:secret@postgres:5432/tzblog
NEXTAUTH_SECRET=<openssl rand -hex 32>
NEXTAUTH_URL=https://your.domain
S3_ENDPOINT=http://minio:9000
S3_ACCESS_KEY=...
S3_SECRET_KEY=...
S3_BUCKET=tzblog-media
GITHUB_USERNAME=ha1den            # 可选，启用 GithubCard
ADMIN_INITIAL_EMAIL=admin@x.com   # seed 用
ADMIN_INITIAL_PASSWORD=...
```

## 启动

```bash
docker compose pull
docker compose up -d
docker compose exec app pnpm db:migrate
docker compose exec app pnpm db:seed
```

## Caddyfile 示例

```
your.domain {
  reverse_proxy app:3000
}
console.your.domain {
  reverse_proxy minio:9001
}
```

## 备份

`postgres` 容器内 cron `pg_dump > /backup/tzblog-$(date +%F).sql`，挂卷到宿主 + rsync 到远端。

`minio` 桶：`mc mirror minio/tzblog-media s3-remote/tzblog-media` 定期跑。

## 升级

```bash
git pull
docker compose build app
docker compose up -d
docker compose exec app pnpm db:migrate
```
```

## docs/development.md / docs/conventions.md 骨架

精炼版直接抄 CLAUDE.md 对应段落，加 `> Last verified: 2026-05-22` 顶端。

## LICENSE 内容

标准 MIT，year 2026，author "ha1den"。从 https://opensource.org/licenses/MIT 复制模板。

## 不要做的事

- 不删 CLAUDE.md（项目级 instructions 仍由 CLAUDE.md 主导）
- 不在 docs/ 复述 CLAUDE.md 全文（docs 是人话版，CLAUDE.md 是 AI instructions）
- 不加 badges / shields (未上线)
- 不写 changelog（next 增量）
- 不接 docusaurus
- 不加 vercel 一键部署按钮（自部署）
- screenshot 用占位 + TODO 注释，不生成假图
