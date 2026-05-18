# CLAUDE.md — TZBlog

> 本文件是 Claude Code 的项目级指令。每次会话开始时自动加载。

@AGENTS.md

## 项目概述

TZBlog 是一个自研的个人技术博客系统。单体 Next.js 15 应用，包含前台展示 + 后台 CMS + 自研 Analytics，部署在自有 VPS（Docker Compose + Caddy）。

## 技术栈

- **框架**：Next.js 15 (App Router / RSC / Server Actions)
- **语言**：TypeScript 5 (strict)
- **数据库**：PostgreSQL 16 + Prisma 5
- **UI**：shadcn/ui + Tailwind CSS v4（CSS 变量驱动主题）
- **编辑器**：Tiptap v2 + tiptap-markdown（WYSIWYG，存储格式为 Markdown）
- **MD 渲染**：remark + rehype + Shiki
- **认证**：Auth.js v5 (Credentials provider)
- **媒体**：MinIO (S3 协议，自部署)
- **部署**：Docker Compose + Caddy (自动 HTTPS) + VPS

## 开发命令

```bash
pnpm dev              # 启动开发服务器 (turbo)
pnpm build            # prisma generate && next build
pnpm lint             # next lint
pnpm typecheck        # tsc --noEmit
pnpm test             # vitest run
pnpm db:migrate       # prisma migrate dev
pnpm db:seed          # tsx prisma/seed.ts
pnpm docker:dev       # 启动本地 Postgres + MinIO 容器
```

## 架构规则

### 路由组织

- `src/app/(site)/` — 前台公开页面，无认证
- `src/app/(admin)/` — 后台管理，middleware 守卫
- `src/app/api/` — REST API
- `src/middleware.ts` — 守 `/admin/*` 和 `/api/admin/*`

### 数据访问

- Server Component 直接 `await db.post.findMany(...)`，不包装无意义 service 层
- 只有跨多表业务流程才拆 `src/lib/services/*.ts`
- 不写 Repository 模式

### API 响应格式

```
成功：{ "data": <T>, "meta": {...} }
失败：{ "error": { "code": "...", "message": "...", "details": {...} } }
```

### 表单 & 校验

- zod schema 写一份，前后端共享（`src/lib/schemas/*.ts`）
- 前端 react-hook-form + @hookform/resolvers/zod
- 后端 API 入口必须 zod.parse(body)

### 主题变量

- 所有颜色必须用 CSS 变量：`color: hsl(var(--fg))`，**禁止**硬编码色值
- 变量定义在 `src/styles/globals.css` 的 `@theme` 块
- 命名：`--bg / --fg / --muted / --accent / --border / --ring` 等语义化

### i18n

- 内容字段抽到 `*Translation` 子表，按 `(parentId, locale)` 唯一
- 查询时 `where: { locale: currentLocale }`
- MVP 写死 "zh"，V3 从 URL 解析

### 计数器

- Post 内嵌 `viewCount / likeCount / commentCount`
- 写入时事务内 `count = count + 1`
- 详情表（PostView / PostLike / Comment）记录原始数据用于去重

### 反垃圾

- `visitorHash = sha256(ip + userAgent + dailySalt)`
- 浏览去重：同访客 + 同文章 + 同天 = 一次
- 点赞：同访客 + 同文章 24h 内一次
- 评论：同 visitorHash 5 分钟内最多 3 条

## 编码规范

- 组件文件 PascalCase：`PostCard.tsx`
- 普通文件 camelCase：`useDebounce.ts`
- 测试文件 `*.test.ts` 与被测文件同目录
- 不要 `try/catch + console.error + 返回空值` 吞错（silent failure 禁忌）
- 业务异常用 `AppError`（`src/lib/errors.ts`）

## Git 规范

- Conventional Commits：`feat:` / `fix:` / `chore:` / `docs:` / `refactor:` / `test:`
- ECC TDD checkpoint：
  - `test: add tests for <feature>` (RED)
  - `feat: implement <feature>` (GREEN)
  - `refactor: clean up <feature>` (REFACTOR)
- 一个 OpenSpec change 一组 commit，不混 feature

## OpenSpec 开发流程

本项目使用 OpenSpec 管理功能变更：

1. `/opsx:new` — 创建新 change（生成 proposal.md）
2. `/opsx:continue` — 生成下一个 artifact（tasks.md / spec）
3. `/opsx:apply` — 按 tasks 实现代码
4. `/opsx:verify` — 验证实现完整性
5. `/opsx:archive` — 归档已完成的 change

## 自定义命令

- `/project:update-context` — 更新 memory-bank 上下文
- `/project:new-feature` — 开始新功能完整流程（OpenSpec + ECC TDD）
- `/project:finish-feature` — 收尾当前功能（verify + archive + 更新进度）

## Memory Bank

项目上下文存储在 `memory-bank/` 目录：

- `projectBrief.md` — 项目定位、目标、约束
- `techContext.md` — 技术栈版本、环境变量、脚本
- `systemPatterns.md` — 架构规则、代码约定
- `activeContext.md` — 当前焦点、下一步
- `progress.md` — 进度跟踪
- `knownIssues.md` — 已知问题

每次会话结束前运行 `/project:update-context` 保持同步。
