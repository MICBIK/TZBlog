# TZBlog

> Last verified: 2026-05-23

自研个人技术博客系统：前台内容展示、后台 CMS、自研 Analytics、媒体存储和自部署链路在一个 Next.js 应用里闭环。

公开展示截图待补：上线前用真实首页截图替换这里，避免 README 引用不存在的占位图片。

## 介绍

TZBlog 是 ha1den 的个人技术博客工程，目标是把写作、发布、互动、分析和部署都掌握在自己的系统里。

- 前台：Editorial 风格首页、文章、专栏、标签、About、RSS、sitemap、OG 图。
- 后台 CMS：文章和专栏管理、Markdown source editor + split preview、媒体库、评论审核。
- 自研 Analytics：前台 PageView 上报，后台仪表盘消费 Postgres 聚合数据。
- 自部署：Docker Compose + Caddy + VPS，不依赖托管平台的默认模板。
- Currently a Chinese (zh-CN) single-locale blog. English translation capability is reserved in the schema and tracked for a future V3 SDD.

## 技术栈

| 类别 | 选型 |
| --- | --- |
| 框架 | Next.js 16.2.6 (App Router / RSC / Server Actions) |
| 语言 | TypeScript 5 strict |
| UI | React 19 + Tailwind CSS v4 + shadcn/ui + Radix UI |
| 数据库 | PostgreSQL 16 + Prisma 7 |
| 认证 | Auth.js v5 (Credentials provider) |
| 编辑器 | CodeMirror 6 Markdown source editor + split preview，存储格式为 Markdown |
| Markdown 渲染 | remark + rehype + Shiki |
| 媒体 | local storage / MinIO (S3 协议) 双 driver |
| 测试 | Vitest + React Testing Library |
| 部署 | Docker Compose + Caddy auto HTTPS + VPS |

## 快速开始

```bash
pnpm install
cp .env.example .env
pnpm docker:dev
pnpm db:migrate
pnpm db:seed
pnpm dev
```

打开 [http://localhost:3000](http://localhost:3000)。本地 Postgres 默认端口来自 `docker/docker-compose.dev.yml`，环境变量以 `.env.example` 为准。

常用质量门：

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

详细本地开发流程见 [docs/development.md](docs/development.md)。

## 项目结构

```text
src/
├── app/(site)/         # 前台公开页面
├── app/(admin)/        # 后台 CMS，proxy 守卫
├── app/api/            # REST API
├── components/         # site / admin / ui / editor 组件
├── lib/services/       # 只放跨表业务流程
├── lib/schemas/        # zod schema，前后端共享
└── proxy.ts            # /admin 与 /api/admin 守卫

prisma/                 # schema、migrations、seed
docker/                 # 本地与生产 compose 文件
docs/                   # 人类可读文档
.claude/sdd/            # Spec-Driven Development artifacts
memory-bank/            # 项目上下文与进度记录
```

## 约定

- Commit 使用 Conventional Commits + scope，例如 `feat(post-detail): SPEC-X-1 add comment form`。
- TDD 微循环为 `test(scope): SPEC RED` -> `feat(scope): SPEC GREEN`，同 scope 配对。
- SDD 变更以 `.claude/sdd/<feature>/` 为 SSOT，先有 `proposal` / `specs` / `test-map` / `tasks` 再执行。
- `[no-tdd]` 仅用于纯文档或纯样式改动，且 staged 文件必须在 hook 白名单内。
- 组件文件用 `PascalCase.tsx`，普通工具文件用 `camelCase.ts`，测试文件与被测文件同目录。

更多规则见 [docs/conventions.md](docs/conventions.md)，架构说明见 [docs/architecture.md](docs/architecture.md)。

## 部署

生产目标是 VPS 自部署。典型启动顺序：

```bash
docker compose pull
docker compose up -d
docker compose exec app pnpm db:deploy
docker compose exec app pnpm db:seed
```

Caddy 负责反向代理与 HTTPS，Postgres 与 MinIO 由 Docker Compose 管理。详细 env、Caddyfile、备份、升级流程见 [docs/deployment.md](docs/deployment.md)。

## License

MIT © 2026 ha1den. See [LICENSE](LICENSE).
