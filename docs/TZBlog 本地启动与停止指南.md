# TZBlog 本地启动与停止指南

## 用途

这份文档是给“下次自己重新把项目拉起来”的操作手册。

它解决的不是项目方向问题，而是很具体的本地运行问题：

- 第一次接手时要准备什么
- 日常预览时按什么顺序启动
- 只想看前台或只想看 CMS 时最少需要起什么
- 看完之后怎么停掉
- 启动失败时先查哪里

## 当前本地架构

TZBlog 当前本地运行涉及 3 组服务：

1. `PostgreSQL`
   由 `infra/docker-compose.yml` 提供，本地开发数据库
2. `Payload CMS`
   位于 `apps/cms`，默认端口 `3000`
3. `Astro Web`
   位于 `apps/web`，默认端口 `4321`

当前阶段的实际完成状态：

- `web` 已有完整界面骨架，可直接查看首页、文章、项目、文档、笔记、搜索、关于等页面
- `cms` 已具备 `Posts / Projects / Docs / Notes` 内容 collections
- 前台主内容页面已切换到 Payload REST API 数据链路
- 如果 Payload API 不可用，前台不再回退示例内容，而是显示 empty state
- 运行时验收、真实内容录入、搜索实索引与统计接入仍需在允许环境中继续完成

## 启动前准备

### 1. 系统前提

本地默认开发环境：

- macOS
- Node.js：满足 `apps/cms/package.json` 中的 engine 要求
- `pnpm`
- Docker Desktop 或可用的 Docker daemon

如果你不确定当前版本，先执行：

```bash
node -v
pnpm -v
docker -v
docker compose version
```

### 2. 确认仓库路径

仓库默认路径：

```bash
/Users/baihaibin/Documents/WorkSpares/TZBlog
```

进入仓库：

```bash
cd /Users/baihaibin/Documents/WorkSpares/TZBlog
```

### 3. 准备环境变量文件

首次启动前，至少确保以下文件存在：

```bash
cp .env.example .env
cp apps/cms/.env.example apps/cms/.env
```

如果你希望前台也显式维护本地环境变量，可以额外复制：

```bash
cp apps/web/.env.example apps/web/.env
```

说明：

- 根目录 `.env` 主要给 Docker Compose 用
- `apps/cms/.env` 是 Payload 启动必需文件
- `apps/web/.env` 建议保留，当前已用于 Payload API URL、后续也会继续承接 Umami 等前台配置

### 4. 安装依赖

首次启动或 `pnpm-lock.yaml` 变化后，执行：

```bash
pnpm install
```

## 推荐的一键方式

如果你后续只是想尽快把本地环境拉起来看效果，优先用根级脚本入口，不用再手动开三条命令。

### 一键启动完整栈

```bash
pnpm local:start
```

这个命令会自动做下面这些事：

- 检查 `node`、`pnpm`、`docker`
- 自动补齐缺失的 `.env`、`apps/cms/.env`、`apps/web/.env`
- 在依赖缺失时执行 `pnpm install`
- 启动 PostgreSQL
- 启动 Payload CMS
- 启动 Astro Web
- 输出访问地址和当前服务状态

### 一键查看状态

```bash
pnpm local:status
```

### 一键停止

```bash
pnpm local:stop
```

### 一键重启

```bash
pnpm local:restart
```

### 只启动前台

```bash
pnpm local:web
```

### 只启动数据库和 CMS

```bash
pnpm local:cms
```

### 日志位置

脚本会把后台运行日志写到系统临时目录 `${TMPDIR:-/tmp}/tzblog-local-dev/`。

常见日志文件是：

- Web: `${TMPDIR:-/tmp}/tzblog-local-dev/web.log`
- CMS: `${TMPDIR:-/tmp}/tzblog-local-dev/cms.log`

如果你启动失败，优先看这两个日志。

## 最常用的启动方式

### 步骤 1：确保 Docker 已启动

### 步骤 2：启动 PostgreSQL

```bash
pnpm db:up
```

### 步骤 3：启动 CMS

```bash
pnpm dev:cms
```

### 步骤 4：启动 Web

```bash
pnpm dev:web
```

### 步骤 5：在浏览器里查看

- Web 首页：`http://localhost:4321`
- 文章列表：`http://localhost:4321/posts`
- 项目列表：`http://localhost:4321/projects`
- 文档列表：`http://localhost:4321/docs`
- 笔记列表：`http://localhost:4321/notes`
- 搜索页：`http://localhost:4321/search`
- 关于页：`http://localhost:4321/about`
- CMS 首页：`http://localhost:3000`
- Payload Admin：`http://localhost:3000/admin`

## 不同场景下的最小启动方式

### 只想看前台界面效果

当前前台主内容页面已经走 Payload API，因此如果要验证真实内容链路，至少需要 CMS 在线；如果只是看纯界面壳层或布局，可以单独起 `web`，但此时内容区块可能显示 empty state。

```bash
pnpm dev:web
```

### 只想看 CMS / Admin

这种情况下需要数据库和 CMS：

```bash
pnpm db:up
pnpm dev:cms
```

### 想看完整本地栈

```bash
pnpm db:up
pnpm dev:cms
pnpm dev:web
```

## 停止方式

### 1. 停掉 Web

`Ctrl+C`

### 2. 停掉 CMS

`Ctrl+C`

### 3. 停掉 PostgreSQL 容器

```bash
pnpm db:down
```

## 每次启动前的快速检查清单

1. 已进入仓库根目录
2. Docker 已启动
3. `.env` 和 `apps/cms/.env` 存在
4. 依赖已经安装过，或者刚执行完 `pnpm install`
5. 如果上次没有正常退出，确认 `3000`、`4321`、`5432` 没被旧进程占着

## 自检命令

```bash
git status --short --branch
pnpm build
pnpm lint
```

## 当前文档边界说明

这份文档只负责描述“本地怎么启动 / 停止 / 看日志 / 访问地址”。
如果你在受限环境中协作，仍然应遵守项目约束：

- 不要在会拖死机器的环境里强行启动完整栈
- 优先做静态代码、文档、OpenSpec、配置层审查
- 运行时验收放到允许环境中进行
