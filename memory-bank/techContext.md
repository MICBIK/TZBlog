# Tech Context — TZBlog

## 技术栈版本

| 层 | 选型 | 版本 | 备注 |
|---|---|---|---|
| Runtime | Node.js | 20 LTS / local 22.x | Docker 镜像目标 `node:20-alpine`，本机验证可用 Node 22 |
| 包管理 | pnpm | 10.29.2 | `pnpm-lock.yaml` 提交 |
| 框架 | Next.js | 16.2.6 | App Router + RSC + Server Actions |
| UI 库 | React | 19.2.4 | 随 Next 16 使用 |
| 语言 | TypeScript | 5.9.x | `strict: true` |
| 样式 | Tailwind CSS | 4.x | CSS-first 配置（`@theme`），主题变量驱动 |
| 组件 | shadcn/ui | latest | 源码本地化，按需 add |
| 数据库 | PostgreSQL | 16 | Docker 容器 `postgres:16-alpine` |
| ORM | Prisma | 7.8.0 | `@prisma/client` + `prisma` CLI + `@prisma/adapter-pg` |
| 认证 | Auth.js | 5.x (beta) | Credentials provider，单管理员 |
| 编辑器 | Markdown source editor + split preview | current | 存储格式 Markdown；编辑层仍保留 Tiptap v3 + `tiptap-markdown` round-trip 依赖 |
| MD 渲染 | remark + rehype + Shiki | latest / Shiki 4.x | 服务端 Markdown 渲染、slug/anchor、代码高亮 |
| 表单 | react-hook-form + zod | latest | API 与表单共享 schema |
| 媒体 | MinIO | latest | S3 协议，与 VPS 同栈 |
| MinIO 客户端 | minio (npm) | latest | 上传 / 签名 URL |
| 反向代理 | Caddy | 2.x | 自动 HTTPS（Let's Encrypt） |
| 容器编排 | Docker Compose | v2 | 4 个服务：app / postgres / minio / caddy |

## 环境变量（key 列表，值不存仓库）

```
# 数据库
DATABASE_URL                # postgresql://user:pass@host:5432/tzblog
SHADOW_DATABASE_URL         # 仅本地 prisma migrate dev 时用

# 认证
AUTH_SECRET                 # openssl rand -base64 32
AUTH_URL                    # https://tzblog.example.com (生产)

# 管理员初始账号（仅首次 seed 用）
ADMIN_EMAIL
ADMIN_PASSWORD              # seed 后必须改

# MinIO / S3
S3_ENDPOINT                 # http://minio:9000 (容器内) 或公网 URL
S3_REGION                   # auto
S3_BUCKET                   # tzblog-media
S3_ACCESS_KEY_ID
S3_SECRET_ACCESS_KEY
S3_PUBLIC_URL               # 媒体公开访问 URL 前缀（一般是 Caddy 代理后的 https://cdn.tzblog.example.com）

# GitHub（首页贡献图、最近项目）
GITHUB_TOKEN                # 可选，公开 repo 可不填；限流提高需要
GITHUB_USERNAME             # 取数据用

# 站点元信息
SITE_URL                    # 用于 RSS / sitemap / OG
SITE_NAME

# Node
NODE_ENV                    # development | production
PORT                        # Next.js 监听端口，默认 3000
```

## 本地开发依赖

| 工具 | 用途 |
|---|---|
| Docker Desktop | 跑 Postgres + MinIO 容器 |
| pnpm | 包管理 |
| Node 20+ | nvm / fnm 管理；生产镜像仍以 Node 20 LTS 为目标 |
| direnv（可选） | `.envrc` 自动加载 |

## 关键脚本（package.json）

```
dev           next dev --turbo
build         prisma generate && next build
start         next start -p ${PORT:-3000}
lint          eslint src --ext .ts,.tsx --max-warnings 0
typecheck     tsc --noEmit
test          vitest run
test:watch    vitest
db:generate   prisma generate
db:migrate    prisma migrate dev
db:deploy     prisma migrate deploy   (生产)
db:seed       tsx prisma/seed.ts
db:studio     prisma studio
docker:dev    docker compose -f docker/docker-compose.dev.yml up -d
docker:prod   docker compose -f docker/docker-compose.yml up -d
```

## 测试栈

- **单元 / 集成**：Vitest
- **组件测试 infra**：Vitest 4 + jsdom + @testing-library/react + @testing-library/user-event（`src/**/*.test.tsx` / `tests/**/*.test.tsx` 自动用 jsdom project）
- **组件**：React Testing Library + Vitest
- **E2E**（backlog）：Playwright；当前以 Vitest + component/integration tests + manual smoke 为主

## VPS 推荐配置

- **首选**：Hetzner CX22（2 vCPU / 4GB / 40GB / 20TB / €4.51）
- **预算富余**：Hetzner CPX21（3 vCPU AMD / 4GB / 80GB / €7.55）
- 启用 swap 1-2GB 防 OOM；Postgres `shared_buffers=256MB`；Next.js `NODE_OPTIONS=--max-old-space-size=1024`

## 不使用的技术（且理由）

| 不用 | 理由 |
|---|---|
| Payload / Strapi / Ghost | 二开成本高，自研 CMS 8-12 天工作量可控 |
| Umami / Plausible / GA | 用户明确要自研分析，数据不外流 |
| Vercel / Cloudflare Pages | 选择自部署 VPS，掌控部署链路 |
| MongoDB / SQLite | 关系型 + 多表 join + 类型安全，Postgres 最合适 |
| Astro | 自研 CMS 后单体 Next.js 更简单；旧版前后分离的痛点不重蹈 |
