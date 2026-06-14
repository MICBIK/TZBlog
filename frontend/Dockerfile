# syntax=docker/dockerfile:1.7

# =============================================================================
# TZBlog Frontend Dockerfile
# 多阶段构建：deps -> builder -> runner
# =============================================================================

FROM node:20-alpine AS base
# 启用 corepack；pnpm 版本由 package.json 的 packageManager 字段决定
RUN corepack enable

# -----------------------------------------------------------------------------
# Stage 1: 安装依赖（利用 Docker 层缓存）
# -----------------------------------------------------------------------------
FROM base AS deps
WORKDIR /app
# 先拷贝 lockfile 与 manifests，最大化缓存命中
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# -----------------------------------------------------------------------------
# Stage 2: 构建
# -----------------------------------------------------------------------------
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# 构建使用生产模式（next.config 已开启 standalone 输出）
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

# -----------------------------------------------------------------------------
# Stage 3: 运行（最小镜像）
# -----------------------------------------------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# 非 root 用户运行
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# 拷贝 standalone 产物（含最小化的 node_modules）
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
