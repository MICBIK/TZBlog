# Handoff Master — TZBlog 部署前任务集

> 这是给"接收 AI"（另一个 AI 助手，由 ha1den 转发）和"审计 AI"（claude）的统一上下文。10 个独立 SDD 任务的协调入口。

## 1. 项目背景

**TZBlog** 是 ha1den 的自研技术博客系统。

- **形态**：单体 Next.js 15 应用（前台公开 + 后台 CMS + 自研 Analytics）
- **部署**：自有 VPS（Docker Compose + Caddy 自动 HTTPS）
- **当前阶段**：P0/P1 全部完成，P2 完成绝大部分（前台展示主体 + RSS/sitemap/OG + 评论点赞 + Analytics 客户端上报）。剩余的 10 项任务是部署上线（P3）前的最后一公里。
- **MVP 目标日期**：2026-06-29（Week 6 末）

## 2. 技术栈（必读 — 接收 AI 实现时严格遵守）

| 层 | 技术 | 版本 / 约束 |
|---|---|---|
| 框架 | Next.js | 15 (App Router / RSC / Server Actions) |
| 语言 | TypeScript | 5 strict |
| 包管理 | **pnpm only** | 禁止 npm / yarn |
| DB | PostgreSQL + Prisma | 16 / 7（driver-adapter @prisma/adapter-pg） |
| UI 业务 | shadcn/ui + Radix | 已装：button/card/dialog/alert-dialog/dropdown-menu/form/input/label/select/separator/sonner/table/tabs/textarea/badge |
| 样式 | Tailwind CSS v4 | CSS 变量驱动主题（`hsl(var(--bg))` 等） |
| 编辑器 | Tiptap v2 + tiptap-markdown | WYSIWYG，存 Markdown |
| MD 渲染 | remark + rehype + Shiki | 服务端 |
| 认证 | Auth.js v5 | Credentials provider |
| 媒体 | MinIO (S3 协议) | local / s3 双 driver |
| 测试 | Vitest + RTL + Playwright | node + jsdom 双 environment |
| 部署 | Docker Compose + Caddy + VPS | _尚未配置（P3 工作）_ |

## 3. 项目结构

```
src/
├── app/
│   ├── (site)/              ← 前台公开，无认证
│   │   ├── page.tsx         ← 首页（当前是模板级，hero-editorial 任务重做）
│   │   ├── about/page.tsx   ← Coming soon 占位（about-page 任务重做）
│   │   ├── posts/           ← 文章列表 + 详情
│   │   ├── columns/         ← 专栏列表 + 详情
│   │   ├── tags/            ← _不存在_，tags-pages 任务新建
│   │   ├── rss.xml/         ← RSS feed
│   │   ├── sitemap.ts       ← sitemap 生成
│   │   └── robots.ts        ← robots.txt
│   ├── (admin)/             ← 后台管理，middleware 守卫
│   │   └── admin/
│   │       ├── columns/
│   │       ├── posts/
│   │       ├── media/
│   │       ├── comments/    ← 评论审核
│   │       └── analytics/   ← _不存在_，analytics-dashboard 任务新建
│   ├── api/                 ← REST API
│   └── middleware.ts        ← 守 /admin/* 和 /api/admin/*
├── components/
│   ├── ui/                  ← shadcn primitives
│   ├── site/                ← 前台业务组件
│   ├── admin/               ← 后台业务组件
│   └── editor/              ← Tiptap 编辑器
├── lib/
│   ├── services/            ← 跨表业务流程（posts/columns/comments/likes/stats/media/...）
│   ├── schemas/             ← zod schemas（前后端共享）
│   ├── errors.ts            ← AppError class
│   ├── api-response.ts      ← API 响应封装
│   ├── visitor.ts           ← visitorHash 计算
│   ├── storage/             ← MinIO/local 存储抽象
│   ├── i18n.ts              ← MVP hardcode "zh"
│   ├── rate-limit.ts        ← 内存版 rate limiter
│   └── env.ts               ← 环境变量校验
├── styles/
│   └── globals.css          ← @theme 块定义 CSS 变量
└── middleware.ts            ← Auth.js 守卫
prisma/
├── schema.prisma            ← 17 张表
└── seed.ts
docker/
└── docker-compose.dev.yml   ← 本地 Postgres + MinIO
memory-bank/
├── projectBrief.md
├── techContext.md
├── systemPatterns.md        ← 架构规则、代码约定
├── activeContext.md         ← 当前焦点
├── progress.md              ← 进度跟踪
└── knownIssues.md           ← 已知问题
.claude/sdd/                 ← SDD artifacts
└── handoff-pre-deploy/      ← 本次 handoff 协调入口
```

## 4. 编码约束（CLAUDE.md 摘要 — 强制遵守）

### 4.1 命名

- 组件：`PascalCase.tsx`（如 `HeroEditorial.tsx`）
- 工具：`camelCase.ts`（如 `formatRelativeTime.ts`）
- 测试：`*.test.ts` / `*.test.tsx`，与被测文件**同目录**
- 类型：`interface` 用于对象 shape，`type` 用于联合/交叉

### 4.2 文件规模

- 典型 200-400 行
- 上限 800 行（hook 拦截 Write 工具）
- 超限必须拆模块

### 4.3 数据访问

- Server Component 直接 `await db.post.findMany(...)`，**不**写无意义 service 层
- 跨表业务流程才放 `src/lib/services/*.ts`
- 禁止 Repository 模式

### 4.4 API 响应

```ts
// 成功
{ data: T, meta?: { total, page, limit } }

// 失败
{ error: { code: string, message: string, details?: object } }
```

### 4.5 表单校验

- zod schema 写一份在 `src/lib/schemas/*.ts`，前后端共享
- 前端：react-hook-form + `@hookform/resolvers/zod`
- 后端 API 入口：`schema.parse(body)` 必须

### 4.6 主题变量（强制）

- **禁止硬编码色值**（如 `bg-red-500`、`#fff`、`rgb(...)`、`hsl(...)`）
- 全部用 CSS 变量：`hsl(var(--bg))` / `text-fg` / `bg-muted` 等
- 变量定义在 `src/styles/globals.css` 的 `@theme` 块
- 语义化命名：`--bg / --fg / --muted / --accent / --border / --ring / --primary / --destructive`

### 4.7 错误处理（CRITICAL）

- 禁止 `try/catch + console.error + 返回空值` 吞错（silent failure）
- 业务异常用 `AppError`（`src/lib/errors.ts`）
- 边界（API 入口）才捕获 unknown，narrow 后处理

### 4.8 不变性

- 永远新建对象，不 mutate
- Set/Map 操作走 `new Set(prev)` / `new Map(prev)` 模式

### 4.9 i18n

- 内容字段抽到 `*Translation` 子表（按 `(parentId, locale)` 唯一）
- 查询 `where: { locale: currentLocale }`
- MVP 写死 `"zh"`，V3 才上 URL 解析

### 4.10 计数器

- Post 内嵌 `viewCount / likeCount / commentCount`
- 写入事务内 `count = count + 1`
- 详情表（`PostView` / `PostLike` / `Comment`）记录原始数据用于去重

## 5. TDD 工作流（强制，hook 自动检查）

### 5.1 微循环（每条 spec 一对 commit）

```
1. 写测试 → 跑 pnpm vitest run <path> → 看到 FAIL（粘真实输出）
   ↓
   git commit -m "test(<scope>): <spec-id> <一句话>"
   ↓
2. 写最小实现 → 跑同样测试 → 看到 PASS（粘真实输出）
   ↓
   git commit -m "feat(<scope>): <spec-id> <一句话>"
```

### 5.2 husky commit-msg hook 强制规则

- `feat:` 必须带 scope：`feat(<scope>): ...`
- `feat:` 提交前 5 个 commit 必须有同 scope 的 `test:` 提交（否则 reject）
- `[no-tdd]` 标签仅在 staged 改动只涉及白名单文件时放行：`*.css/*.scss/*.sass/*.less/*.md/*.mdx/*.txt/*.rst`
- 重构/配置变更**不**在 `[no-tdd]` 范围

### 5.3 commit type 选择

| Type | 用途 |
|---|---|
| `feat(<scope>):` | 新功能 / TDD GREEN 提交 |
| `fix(<scope>):` | Bug 修复 |
| `refactor(<scope>):` | 重构（行为不变） |
| `test(<scope>):` | TDD RED 提交 / 补外围测试 |
| `docs(<scope>):` | 文档（含 memory-bank） |
| `chore(<scope>):` | 工具配置 / 依赖管理 |
| `perf(<scope>):` | 性能优化 |

### 5.4 RED 阶段的真实性要求

- **必须**粘贴真实终端的 `FAIL` / `FAILED` 输出
- 声明式 RED（"测试会失败"）视为违规
- RED 环境不可用时，挂起当前微循环补 `[RED-补证]` 任务

## 6. 10 项任务清单

| # | SDD | Tier | scope | 工作量 | 依赖 |
|---|---|---|---|---|---|
| 0.1 | [docs-sync](../docs-sync/) | T2 | docs | 10min | 无 |
| 0.2 | [confirm-dialog-replication](../confirm-dialog-replication/) | T2 | admin-posts / admin-columns | 1h | 无（方案已在 admin-comments 验证） |
| 1.1 | [hero-editorial](../hero-editorial/) | T1 | site-home | 1-2 天 | 无（决定后续 Editorial 系统视觉） |
| 1.2 | [tech-stack-section](../tech-stack-section/) | T2 | site-home | 0.5 天 | 1.1 视觉对齐 |
| 1.3 | [github-data-card](../github-data-card/) | T2 | site-home | 0.5 天 | 1.1 视觉对齐 |
| 2.1 | [about-page](../about-page/) | T1 | site-about | 0.5-1 天 | 1.1 视觉对齐 |
| 2.2 | [tags-pages](../tags-pages/) | T1 | site-tags | 0.5 天 | 无 |
| 3.1 | [analytics-dashboard](../analytics-dashboard/) | T3 | admin-analytics | 1-2 天 | 无（数据源 PageView 已就绪） |
| 4.1 | [readme-and-docs](../readme-and-docs/) | T3 | docs | 0.5 天 | 无 |
| 4.2 | [lighthouse-prep](../lighthouse-prep/) | T3 | site-* | 0.5 天 | 1.x + 2.x（首页需重做完才能跑） |

## 7. 关键决策（ha1den 已锁定）

| 决策 | 选择 | 理由 |
|---|---|---|
| Hero 视觉方向 | **Editorial / 杂志风** | 与技术博客 + 长文阅读场景匹配；实现复杂度低；后续 tech-stack / github-card / about-page 都要协调到 Editorial 风 |
| About 页素材 | placeholder 后替换 | 接收 AI 用合理 placeholder（如 `Hi I'm ha1den, a developer based in ____`）；ha1den 上线前手工替换 |
| GitHub 数据 API | Public API + Edge cache 1h | 匿名 60 req/h 加缓存够用，零配置 |

## 8. 验证 / 质量门

每个 SDD 完成后，接收 AI **必须**确认以下全部绿：

```bash
pnpm typecheck       # tsc --noEmit
pnpm lint            # eslint, --max-warnings 0
pnpm test            # 全套 vitest
pnpm build           # next build（除非 SDD 明确说明跳过）
```

**禁止**用 `--no-verify` 跳 hook、用 `[no-tdd]` 滥用、或在 RED 缺证时编造输出。

## 9. 完成后归档

每个 SDD 完成后由 claude（审计阶段）执行：

1. `/project:finish-feature` 收尾
2. `git mv .claude/sdd/<feature> .claude/sdd/archive/2026-MM-DD-<feature>`
3. 更新 `memory-bank/progress.md` + `activeContext.md`

## 10. 入口指引

- **接收 AI**：从 [handoff-guide.md](./handoff-guide.md) 入门
- **执行顺序**：见 [execution-plan.md](./execution-plan.md)
- **每个任务**：从对应 SDD 目录的 `handoff.md` 开始

---

**最后提醒**：

> 这个项目已运行 ~3 周，有完整 TDD 文化 + commit-msg hook 守门。接收 AI 任何"绕过 TDD 节奏"、"声明式 RED"、"silent failure 吞错"的操作都会被审计阶段抓出来打回。请把 CLAUDE.md 当作 spec 的一部分，不是 nice-to-have。
