> Last verified: 2026-05-22

# 部署

TZBlog 的生产目标是自有 VPS + Docker Compose + Caddy。当前 `docker/docker-compose.yml` 是 P3 部署骨架，服务边界已经确定，正式上线前还需要补齐真实域名、生产 env、镜像构建和备份策略。

## 前置

- VPS：Ubuntu 22.04+，建议 2 vCPU / 4GB RAM 起步。
- Docker 24+ 与 Docker Compose v2。
- 域名和 DNS A record 指向 VPS IP。
- 服务器开放 `80` / `443`，Postgres、MinIO、Next.js app 只走 Docker internal network。
- 本地或 CI 能访问仓库，并能执行 `pnpm build`。

## 准备 env

复制 `.env.example` 为生产环境文件，并改成真实值。当前 compose 读取仓库根目录 `.env`：

```bash
cp .env.example .env
```

关键变量：

```env
DATABASE_URL=postgresql://postgres:<strong-password>@postgres:5432/tzblog
SHADOW_DATABASE_URL=

AUTH_SECRET=<openssl rand -base64 32>
AUTH_URL=https://your.domain

ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=<change-before-seed>

STORAGE_DRIVER=s3
S3_ENDPOINT=http://minio:9000
S3_REGION=auto
S3_BUCKET=tzblog-media
S3_ACCESS_KEY_ID=<minio-access-key>
S3_SECRET_ACCESS_KEY=<minio-secret-key>
S3_PUBLIC_URL=https://cdn.your.domain/tzblog-media

GITHUB_USERNAME=ha1den
GITHUB_TOKEN=

SITE_URL=https://your.domain
SITE_NAME=TZBlog
NODE_ENV=production
PORT=3000

SITE_DOMAIN=your.domain
CDN_DOMAIN=cdn.your.domain
POSTGRES_DB=tzblog
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<strong-password>
MINIO_ROOT_USER=<minio-root-user>
MINIO_ROOT_PASSWORD=<minio-root-password>
```

上线前至少要轮换 `AUTH_SECRET`、`POSTGRES_PASSWORD`、`MINIO_ROOT_PASSWORD`、`S3_ACCESS_KEY_ID`、`S3_SECRET_ACCESS_KEY`、`ADMIN_PASSWORD`。

## docker-compose.yml 概览

`docker/docker-compose.yml` 定义 4 个服务：

| 服务 | 作用 | 暴露 |
| --- | --- | --- |
| `app` | Next.js standalone app | internal `3000` |
| `postgres` | PostgreSQL 16 | internal only |
| `minio` | S3-compatible media storage | internal `9000` / console `9001` |
| `caddy` | 反向代理与 auto HTTPS | host `80` / `443` |

数据卷：

- `postgres_data` 保存数据库。
- `minio_data` 保存媒体文件。
- `caddy_data` / `caddy_config` 保存证书和 Caddy 状态。

## 启动步骤

推荐先在服务器上完成一次 build 验证，再启动 compose：

```bash
pnpm install
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

启动生产服务：

```bash
docker compose -f docker/docker-compose.yml pull
docker compose -f docker/docker-compose.yml build app
docker compose -f docker/docker-compose.yml up -d
docker compose -f docker/docker-compose.yml exec app pnpm db:deploy
docker compose -f docker/docker-compose.yml exec app pnpm db:seed
```

`pnpm docker:prod` 等价于：

```bash
pnpm docker:prod
```

首次 seed 后立刻登录后台修改管理员密码，或删除临时 seed 凭据。

## Caddy 配置示例

当前 `docker/Caddyfile` 使用 `SITE_DOMAIN` 和 `CDN_DOMAIN`：

```caddyfile
{$SITE_DOMAIN:localhost} {
  encode zstd gzip
  reverse_proxy app:3000
}

{$CDN_DOMAIN:cdn.localhost} {
  encode zstd gzip
  reverse_proxy minio:9000
}
```

Caddy 会自动申请和续期 HTTPS 证书。DNS 生效前不要反复重启尝试，以免触发证书签发频率限制。

## 备份

Postgres：

```bash
docker compose -f docker/docker-compose.yml exec postgres \
  pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > "backup/tzblog-$(date +%F).sql"
```

建议用 cron 每日执行，并把 `backup/` 同步到另一台机器或对象存储。恢复演练至少在上线前做一次。

MinIO：

```bash
mc mirror minio/tzblog-media s3-remote/tzblog-media
```

如果暂时没有远端对象存储，至少定期备份 `minio_data` volume。

## 监控

- Caddy access log：确认 4xx / 5xx、TLS、反代状态。
- Docker healthcheck：`postgres` 和 `minio` 已配置基础 healthcheck。
- 后台 Analytics：上线后观察 `/api/track` PageView 是否入库。
- 磁盘：重点关注 Postgres volume、MinIO volume、Caddy cert data。

## 升级

常规升级：

```bash
git pull
pnpm install
pnpm typecheck
pnpm lint
pnpm test
pnpm build
docker compose -f docker/docker-compose.yml build app
docker compose -f docker/docker-compose.yml up -d
docker compose -f docker/docker-compose.yml exec app pnpm db:deploy
```

如果本次包含 migration，先备份 Postgres，再执行 `pnpm db:deploy`。发现 migration 异常时不要直接改生产库，先在本地或临时库复现。
