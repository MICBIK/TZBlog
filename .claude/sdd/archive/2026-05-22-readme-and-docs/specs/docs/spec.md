# specs/docs — docs/ 文档要求

> spec-id 前缀：`SPEC-DOC-D`
> 这些是 content spec（不写 typed test）；review 时手动验内容覆盖。

## SPEC-DOC-D-1 — docs/architecture.md

```gherkin
THEN /docs/architecture.md contains sections:

  # 架构概览
  ## 路由组
    - (site) 公开前台
    - (admin) 后台 + middleware 守
    - api/ REST
  ## 数据访问
    - Server Component 直接 db
    - Service layer only for 跨表
    - 不写 Repository
  ## API 响应格式
    - 成功 { data, meta }
    - 失败 { error: { code, message, details } }
  ## Auth (Auth.js v5)
    - Credentials provider
    - middleware 守 /admin/* /api/admin/*
  ## 主题
    - CSS variables driven (--bg / --fg / ...)
    - 禁硬编码色值
    - @theme block in src/app/globals.css
  ## i18n
    - *Translation subtable per content type
    - currentLocale via getCurrentLocale()
    - MVP "zh"
  ## 计数器
    - viewCount / likeCount / commentCount inline on Post
    - 事务内递增
    - 详情表去重
  ## 反垃圾
    - visitorHash = sha256(ip + userAgent + dailySalt)
    - 浏览去重 / 点赞 24h / 评论 5min × 3

AND top of file: `> Last verified: 2026-05-22`
```

## SPEC-DOC-D-2 — docs/deployment.md

```gherkin
THEN /docs/deployment.md contains sections:

  # 部署
  ## 前置
    - VPS (Ubuntu 22.04+ 推荐)
    - Docker + Docker Compose
    - 域名 + DNS A record
  ## 准备 env
    - DATABASE_URL
    - NEXTAUTH_SECRET
    - NEXTAUTH_URL
    - S3 (MinIO) creds: S3_ENDPOINT / ACCESS_KEY / SECRET_KEY / BUCKET
    - GITHUB_USERNAME (optional, for GithubCard)
    - ADMIN_INITIAL_EMAIL / ADMIN_INITIAL_PASSWORD (seed)
  ## docker-compose.yml 概览
    - app service
    - postgres service
    - minio service
    - caddy service (auto HTTPS)
  ## 启动步骤
    - docker compose pull
    - docker compose up -d
    - 首次 migrate: docker compose exec app pnpm db:migrate
    - 首次 seed: docker compose exec app pnpm db:seed
  ## Caddy 配置示例 (Caddyfile)
    - your.domain { reverse_proxy app:3000 }
  ## 备份
    - postgres dump cron
    - MinIO bucket sync 到 S3 / 远端
  ## 监控
    - Caddy access log
    - admin dashboard (内置 analytics)
  ## 升级
    - git pull → docker compose build → docker compose up -d
    - 注意 migration

AND top: `> Last verified: 2026-05-22`
```

## SPEC-DOC-D-3 — docs/development.md

```gherkin
THEN /docs/development.md contains:

  # 本地开发
  ## 前置
    - Node 20+
    - pnpm 9+
    - Docker (for pg + minio local)
  ## 步骤
    - pnpm install
    - cp .env.example .env (modify if needed)
    - pnpm docker:dev (启 local pg + minio)
    - pnpm db:migrate
    - pnpm db:seed
    - pnpm dev
  ## 常用命令
    - pnpm dev / build / lint / typecheck / test
    - pnpm db:migrate / db:seed
    - pnpm docker:dev / docker:down
  ## 编辑器
    - Tiptap demo: /admin/_editor-demo
  ## MinIO local console
    - URL / default creds
  ## 测试
    - pnpm test (vitest)
    - pnpm test --watch
    - pnpm test src/path/to/file
  ## 调试 tips
    - prisma studio: pnpm dlx prisma studio
    - vitest UI: pnpm test --ui

AND top: `> Last verified: 2026-05-22`
```

## SPEC-DOC-D-4 — docs/conventions.md

```gherkin
THEN /docs/conventions.md contains:

  # 约定
  ## Commit
    - Conventional Commits + scope
    - feat / fix / refactor / test / chore / docs / perf / ci
    - 示例:
      - feat(post-detail): SPEC-FOO-1 ...
      - test(post-detail): SPEC-FOO-1 ...
  ## TDD 节奏
    - test(scope): SPEC RED
    - feat(scope): SPEC GREEN
    - 同 scope 配对
  ## husky commit-msg hook
    - 未带 [no-tdd] 的 feat: 必须前 5 个 commit 有同 scope 的 test:
    - 否则拒绝
  ## NO-TDD 例外
    - 仅 .md / .css / .scss / 视觉调整
    - commit 必须带 [no-tdd] 标签
  ## SDD (Spec-Driven Development)
    - .claude/sdd/<feature>/ 存 proposal / specs / test-map / tasks / handoff
    - 每 spec 1 微循环
    - test-map 强制前置
  ## 命名
    - 组件 PascalCase.tsx
    - util camelCase.ts
    - 测试 *.test.ts 同目录

AND top: `> Last verified: 2026-05-22`
```
