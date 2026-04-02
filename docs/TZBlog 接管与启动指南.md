# TZBlog 接管与启动指南

## 用途

这份文档用于在上下文丢失、切换新的 AI 或新的协作者时，快速恢复项目状态并直接进入开发，不再重新推断方向。

## 当前状态

- 项目目录：`/Users/baihaibin/Documents/WorkSpares/TZBlog`
- 当前仓库状态：已完成工程骨架、Payload 内容 collections，以及 Astro 前台主内容数据链路接入
- 已锁定目标：完整前后端博客，不再回退到纯静态前台方案
- 已接入：`OpenSpec` 作为默认变更管理机制

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
3. `openspec/project.md`
4. `docs/TZBlog OpenSpec 变更管理规范.md`
5. `docs/TZBlog 技术选型决策.md`
6. `docs/TZBlog 全新设计方案.md`
7. `docs/TZBlog CMS数据链路实现方案.md`

如果只是要自己把本地环境重新拉起来，优先看：

- `docs/TZBlog 本地启动与停止指南.md`

## OpenSpec 接手动作

正式开始前先执行：

1. `npx -y @fission-ai/openspec@1.2.0 list`
2. 查看当前是否已有 active changes
3. 如果有 active change，优先继续它，不要并行新开同目标 change
4. 如果没有 active change，再创建新的 change proposal 后进入实现

只有纯错别字、纯路径修正、纯排版整理这类无行为影响的小改动，才允许跳过 OpenSpec。

## 当前实现基线

### 产品层

- 首页承担内容分发，不是纯视觉首屏
- 文章、项目、文档、笔记、实验室是并列一级内容入口
- 关于页存在，但不是全站主叙事核心

### 技术层

- `Astro` 负责前台页面展示
- `Payload` 负责内容后台与发布
- `PostgreSQL` 负责主数据
- `Umami` 负责站点统计
- `Pagefind` 负责前台全文搜索
- Monorepo 使用 `pnpm workspace + turbo`

### 工程层

- 根目录已存在 `package.json`、`pnpm-workspace.yaml`、`turbo.json`
- `apps/web` 已具备完整前台界面骨架，覆盖首页、列表页、详情页、搜索、实验室、关于等核心路由
- `apps/cms` 已注册 `Posts / Projects / Docs / Notes` collections
- `infra/docker-compose.yml` 已可启动本地 PostgreSQL
- `apps/web/src/lib/payload.ts` 已作为统一 Payload API 请求层存在

### 数据链路层

- 前台主内容页面已从硬编码静态内容切换到 Payload REST API
- API 不可用时前台不再回退示例内容，而是显示 empty state
- 运行时验收、真实内容录入、草稿/发布验证仍需在允许环境中继续完成

### 设计层

- 首页 Hero 使用一个土星气质的主行星
- 3D 只用于首页 Hero 与少量横幅区
- 正文阅读区不挂重型背景和高频特效

## 推荐仓库结构

```text
TZBlog/
├── apps/
│   ├── web/                  # Astro 前端
│   └── cms/                  # Payload CMS 后台
├── packages/
│   └── .gitkeep
├── infra/
│   ├── docker-compose.yml
│   └── ...
├── openspec/
└── docs/
```

## 当前已完成 / 未完成

### 当前已完成

1. 建立 `pnpm workspace + turbo` monorepo 结构
2. 初始化 `apps/web` 的 Astro 项目
3. 初始化 `apps/cms` 的 Payload 项目
4. 建立 `PostgreSQL` 本地开发环境
5. 建立 Astro 的基础 layout、首页和文章详情页骨架
6. 建立 Payload 基础业务 collections：`posts / projects / docs / notes`
7. 打通 Astro 前台主内容页面到 Payload REST API 的主数据链路
8. 去除前台主链路对示例内容 fallback 的依赖

### 当前未完成

1. 建立更完整的 Payload globals（如 `siteSettings / navigation / homepage / socialLinks / seoDefaults`）
2. 完成真实运行时验收（Admin 创建内容、API 验证、前台构建验证）
3. 完成搜索实索引（Pagefind）与统计接入（Umami）闭环
4. 完成对象存储 / media 方案的正式接入

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

### `apps/cms/.env`

```bash
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/tzblog
PAYLOAD_SECRET=
S3_ENDPOINT=
S3_BUCKET=
S3_ACCESS_KEY=
S3_SECRET_KEY=
NEXT_PUBLIC_SERVER_URL=http://localhost:3000
WEB_REBUILD_WEBHOOK=
```

### `apps/web/.env`

```bash
PAYLOAD_PUBLIC_URL=
PAYLOAD_API_URL=
PAYLOAD_API_TOKEN=
SITE_URL=
UMAMI_SCRIPT_URL=
UMAMI_WEBSITE_ID=
```

说明：当前前台正式入口应优先使用 `PAYLOAD_API_URL`；`PAYLOAD_PUBLIC_URL` 仅作为兼容兜底保留。

## 本地开发默认策略

- 在开发者自己的机器上，本地数据库优先使用 Docker 启动 PostgreSQL
- 本地对象存储如果没有 R2，可先用 MinIO 兼容方案
- 前台和后台分开运行
- 统计系统可以先不在第一天跑通，但预留环境变量
- 如果是在 OpenClaw 所在的受限 / 共享机器上协作，默认不要拉 Docker 镜像、启动数据库或长时间运行本地服务；优先只做静态代码、文档、OpenSpec、配置层审查，再由用户在自己的机器上做运行时验收
- 具体命令顺序、停止方式和常见故障排查见 `docs/TZBlog 本地启动与停止指南.md`

## 第一轮开发顺序

推荐接手后的实际执行顺序：

1. 确认 active change 与 OpenSpec 基线
2. 优先完成 CMS / Web 数据契约与主内容链路
3. 在允许环境中完成运行时验收
4. 再补 globals / search / analytics / media
5. 最后再接 Hero 3D、Pagefind细节、Umami运营细节

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
- 知道前台主内容页面已经走 Payload API，而不是示例内容主链路

## 当前仍未锁死的实现细节

以下属于实现细节，可在开发时根据实际情况调整，不视为方向变更：

- 对象存储最终是 `R2` 还是 `S3`
- 本地反向代理用 `Caddy` 还是 `Nginx`
- Astro 数据拉取使用构建阶段 API 拉取还是专门同步脚本

## 最后结论

如果上下文现在丢失，新的 AI 只要按这份文档、`openspec/project.md` 和相关主文档阅读顺序接手，已经可以正确进入当前主线，不需要重新讨论项目方向；但运行时验收仍应放到允许环境中完成。
