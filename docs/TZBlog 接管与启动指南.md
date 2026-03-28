# TZBlog 接管与启动指南

## 用途

这份文档用于在上下文丢失、切换新的 AI 或新的协作者时，快速恢复项目状态并直接进入开发，不再重新推断方向。

## 当前状态

- 项目目录：`/Users/baihaibin/Documents/WorkSpares/TZBlog`
- 当前仓库状态：只有文档，尚未开始代码实现
- 已锁定目标：完整前后端博客，不再回退到纯静态前台方案

## 已锁定的关键决策

以下内容默认视为已确认，除非用户明确要求修改，否则不要重新讨论：

- 前台：`Astro`
- 后台：`Payload CMS`
- 数据库：`PostgreSQL`
- 统计：`Umami`
- 媒体：`S3 / R2` 兼容对象存储
- 搜索：`Pagefind`
- 前台视觉主线：`深空观测站 + 主行星 Hero`
- 内容模型：`posts / projects / docs / notes / pages`
- 项目目标：做一个完整前后端宇宙主题内容型博客，而不是展示型单页作品集

## 先读哪些文档

接手时按以下顺序阅读：

1. `README.md`
2. `docs/PROJECT_INDEX.md`
3. `docs/TZBlog 技术选型决策.md`
4. `/Users/baihaibin/Documents/ODWorkerSpace/博客/站点规划/TZBlog - 宇宙主题个人网站实现计划.md`
5. `docs/TZBlog 全新设计方案.md`

## 当前实现基线

### 产品层

- 首页承担内容分发，不是纯视觉首屏
- 文章、项目、文档、实验室是并列一级内容入口
- 关于页存在，但不是全站主叙事核心

### 技术层

- `Astro` 负责前台页面展示
- `Payload` 负责内容后台与发布
- `PostgreSQL` 负责主数据
- `Umami` 负责站点统计
- `Pagefind` 负责前台全文搜索

### 设计层

- 首页 Hero 使用一个土星气质的主行星
- 3D 只用于首页 Hero 与少量横幅区
- 正文阅读区不挂重型背景和高频特效

## 推荐仓库结构

默认按以下结构启动：

```text
TZBlog/
├── apps/
│   ├── web/                  # Astro 前端
│   └── cms/                  # Payload CMS 后台
├── packages/
│   ├── shared-types/
│   └── design-tokens/
├── infra/
│   ├── docker-compose.yml
│   ├── env/
│   └── scripts/
└── docs/
```

## 第一阶段必须完成的内容

接手后第一阶段不要直接做视觉特效，先完成以下基础设施：

1. 建立 `pnpm workspace` 或等价 monorepo 结构
2. 初始化 `apps/web` 的 Astro 项目
3. 初始化 `apps/cms` 的 Payload 项目
4. 建立 `PostgreSQL` 本地开发环境
5. 建立最小 `media` 存储方案
6. 建立 Payload 的基础 collections
7. 建立 Astro 的基础 layout 和首页骨架
8. 打通 `Payload -> Astro` 的内容拉取链路

## Payload 最小模型

第一版最少建立这些 collections：

- `posts`
- `projects`
- `docs`
- `notes`
- `media`
- `users`

第一版最少建立这些 globals：

- `siteSettings`
- `navigation`
- `homepage`
- `socialLinks`
- `seoDefaults`

## 环境变量建议

接手时默认准备这些环境变量，不必等实现到一半再补：

### `apps/cms/.env`

```bash
DATABASE_URL=
PAYLOAD_SECRET=
S3_ENDPOINT=
S3_BUCKET=
S3_ACCESS_KEY=
S3_SECRET_KEY=
PUBLIC_SERVER_URL=
WEB_REBUILD_WEBHOOK=
```

### `apps/web/.env`

```bash
PAYLOAD_PUBLIC_URL=
PAYLOAD_API_TOKEN=
SITE_URL=
UMAMI_SCRIPT_URL=
UMAMI_WEBSITE_ID=
```

## 本地开发默认策略

- 本地数据库优先使用 Docker 启动 PostgreSQL
- 本地对象存储如果没有 R2，可先用 MinIO 兼容方案
- 前台和后台分开运行
- 统计系统可以先不在第一天跑通，但预留环境变量

## 第一轮开发顺序

推荐接手后的实际执行顺序：

1. 初始化 workspace
2. 启动 Astro
3. 启动 Payload
4. 建模 collections / globals
5. 在 Astro 中拉取 `posts` 和 `homepage`
6. 做出无特效首页
7. 做出文章详情页
8. 再加项目页和文档页
9. 最后再接 Hero 3D、Pagefind、Umami

## 暂时不要做的事

以下内容默认延后：

- 复杂 shader
- 多主星体场景
- 可拖拽行星
- 评论系统
- 会员系统
- 自研后台
- 自研统计系统
- 先做大量动效再补内容结构

## 接手成功的标准

新的 AI 或协作者接手后，如果能在不额外追问方向的情况下完成以下事项，就说明接管成功：

- 正确建立 `Astro + Payload + PostgreSQL` 基础结构
- 不再尝试回退到纯静态博客方案
- 正确理解首页 Hero 只是视觉层，不是主业务层
- 正确把 `posts / projects / docs / notes / pages` 作为核心内容模型
- 知道 Umami 是统计层，不是 CMS

## 当前仍未锁死的实现细节

以下属于实现细节，可在开发时根据实际情况调整，不视为方向变更：

- Monorepo 用 `pnpm workspace` 还是加 `turbo`
- 对象存储最终是 `R2` 还是 `S3`
- 本地反向代理用 `Caddy` 还是 `Nginx`
- Astro 数据拉取使用构建阶段 API 拉取还是专门同步脚本

## 最后结论

如果上下文现在丢失，新的 AI 只要按这份文档和相关主文档阅读顺序接手，已经可以正确启动项目，不需要重新讨论项目方向。
