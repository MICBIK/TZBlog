> Last verified: 2026-05-22

# 本地开发

本文描述从空环境启动 TZBlog 的最短路径。包管理统一使用 `pnpm`。

## 前置

- Node.js 20 LTS。
- pnpm 9+。
- Docker Desktop 或 Docker Engine，用于本地 Postgres + MinIO。
- 可选：direnv / fnm / nvm，用于本地环境变量和 Node 版本管理。

## 步骤

安装依赖：

```bash
pnpm install
```

准备环境变量：

```bash
cp .env.example .env
```

本地默认配置会连接：

- Postgres: `localhost:5432` in `.env.example`，如使用 dev compose 的默认映射则建议改为 `localhost:5433`。
- MinIO S3 API: `http://localhost:9000`。
- MinIO Console: `http://localhost:9001`。

启动本地依赖：

```bash
pnpm docker:dev
```

初始化数据库：

```bash
pnpm db:migrate
pnpm db:seed
```

启动应用：

```bash
pnpm dev
```

打开 [http://localhost:3000](http://localhost:3000)。后台登录页是 `/login`，默认 seed 账号以 `.env` 的 `ADMIN_EMAIL` / `ADMIN_PASSWORD` 为准。

## 常用命令

| 命令 | 用途 |
| --- | --- |
| `pnpm dev` | 启动 Next.js dev server |
| `pnpm build` | `prisma generate && next build` |
| `pnpm start` | 启动生产构建 |
| `pnpm lint` | ESLint，`--max-warnings 0` |
| `pnpm typecheck` | TypeScript `tsc --noEmit` |
| `pnpm test` | Vitest run |
| `pnpm test:watch` | Vitest watch mode |
| `pnpm db:generate` | Prisma generate |
| `pnpm db:migrate` | Prisma migrate dev |
| `pnpm db:deploy` | Prisma migrate deploy |
| `pnpm db:seed` | 执行 `prisma/seed.ts` |
| `pnpm db:studio` | Prisma Studio |
| `pnpm docker:dev` | 启动本地 Postgres + MinIO |
| `pnpm docker:prod` | 启动生产 compose |

停止本地依赖：

```bash
docker compose -f docker/docker-compose.dev.yml down
```

清理本地持久化数据前先确认没有重要内容：

```bash
rm -rf .docker-data
```

## 编辑器

后台文章编辑器基于 Tiptap + tiptap-markdown，内部编辑 ProseMirror document，最终保存 Markdown 字符串。

开发时可访问：

```text
/admin/_editor-demo
```

该 demo 用于验证编辑器基础交互、Markdown 序列化和预览，不是公开页面。

## MinIO local console

本地 compose 暴露：

```text
S3 API:  http://localhost:9000
Console: http://localhost:9001
```

默认账号来自 `.env.example`：

```env
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin
```

媒体 driver 默认是 `local`，写入 `public/uploads`。需要验证 MinIO/S3 driver 时，把 `.env` 改成：

```env
STORAGE_DRIVER=s3
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin
S3_BUCKET=tzblog-media
S3_PUBLIC_URL=http://localhost:9000/tzblog-media
```

## 测试

跑全量测试：

```bash
pnpm test
```

跑单文件：

```bash
pnpm vitest run src/lib/services/posts.test.ts
```

Watch mode：

```bash
pnpm test:watch
```

Vitest 配了两个 project：

- `*.test.ts` 走 node environment。
- `*.test.tsx` 走 jsdom + `vitest.setup.ts`。

DB 测试会共享本地测试库，并通过 `tests/helpers/db.ts` 做 reset。涉及 DB 的测试不要并行手动跑多个写入进程。

## 调试 tips

Prisma Studio：

```bash
pnpm db:studio
```

查看本地容器：

```bash
docker compose -f docker/docker-compose.dev.yml ps
docker compose -f docker/docker-compose.dev.yml logs -f postgres
docker compose -f docker/docker-compose.dev.yml logs -f minio
```

常见问题：

- `.env.example` 的 `DATABASE_URL` 是 `localhost:5432`；dev compose 默认映射 `5433:5432`，本地开发通常要把 `.env` 改成 `localhost:5433`。
- 登录本地 `.local` 邮箱可能被前端 email schema 拒绝；使用 `.env.example` 的 `admin@example.com` 更稳。
- 如果 MinIO bucket 不存在，先通过 console 创建 `tzblog-media`，或执行已有 seed / storage 初始化流程。
