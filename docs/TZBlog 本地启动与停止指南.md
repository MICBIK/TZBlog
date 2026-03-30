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
- `cms` 已能启动 Payload 和 Admin，但业务 collections / globals 还没全部建完
- 数据链路尚未打通到真实内容源，前台目前仍以示例内容为主

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
- `apps/web/.env` 当前不是启动硬前置，但建议保留，后续接 CMS / Umami 时会更顺手

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

在 macOS 上，这个目录通常会实际展开成 `/var/folders/.../T/tzblog-local-dev/`。

常见日志文件是：

- Web: `${TMPDIR:-/tmp}/tzblog-local-dev/web.log`
- CMS: `${TMPDIR:-/tmp}/tzblog-local-dev/cms.log`

如果你启动失败，优先看这两个日志。

## 最常用的启动方式

如果你只是想把完整本地环境跑起来看效果，按下面顺序做。

### 步骤 1：确保 Docker 已启动

先确认 Docker Desktop 已经打开，或者 Docker daemon 可用。

如果 Docker 没起，后面执行 `pnpm db:up` 会失败。

### 步骤 2：启动 PostgreSQL

在仓库根目录执行：

```bash
pnpm db:up
```

如果你想看数据库日志：

```bash
pnpm db:logs
```

看到健康输出后，用 `Ctrl+C` 退出日志查看即可，数据库容器不会因此停止。

### 步骤 3：启动 CMS

打开一个新的终端窗口或 tab，进入仓库后执行：

```bash
pnpm dev:cms
```

正常情况下会看到类似输出：

```text
Local:   http://localhost:3000
```

### 步骤 4：启动 Web

再打开一个新的终端窗口或 tab，进入仓库后执行：

```bash
pnpm dev:web
```

正常情况下会看到类似输出：

```text
Local:   http://localhost:4321/
```

### 步骤 5：在浏览器里查看

完整启动后，常用地址如下：

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

当前前台还主要使用示例内容，所以只看界面时，最少可以直接起 `web`：

```bash
pnpm dev:web
```

访问：

```text
http://localhost:4321
```

适用场景：

- 看首页和页面壳层
- 看文章/项目/文档/笔记列表与详情布局
- 看搜索页交互壳层

### 只想看 CMS / Admin

这种情况下需要数据库和 CMS：

```bash
pnpm db:up
pnpm dev:cms
```

访问：

```text
http://localhost:3000/admin
```

### 想看完整本地栈

按顺序启动：

```bash
pnpm db:up
pnpm dev:cms
pnpm dev:web
```

## 停止方式

结束本地会话时，建议按下面顺序停。

### 1. 停掉 Web

在运行 `pnpm dev:web` 的终端按：

```text
Ctrl+C
```

### 2. 停掉 CMS

在运行 `pnpm dev:cms` 的终端按：

```text
Ctrl+C
```

### 3. 停掉 PostgreSQL 容器

回到仓库根目录执行：

```bash
pnpm db:down
```

这样会停止并移除本地 PostgreSQL 容器和网络，但会保留 volume 数据。

## 每次启动前的快速检查清单

如果你只是日常回来继续看项目，可以先过一遍这个最小清单：

1. 已进入仓库根目录
2. Docker 已启动
3. `.env` 和 `apps/cms/.env` 存在
4. 依赖已经安装过，或者刚执行完 `pnpm install`
5. 如果上次没有正常退出，确认 `3000`、`4321`、`5432` 没被旧进程占着

## 自检命令

如果你怀疑仓库状态不对，可以先跑这几个命令：

```bash
git status --short --branch
pnpm build
pnpm lint
```

说明：

- `pnpm build` 用于确认 `web` 和 `cms` 当前能构建
- `pnpm lint` 用于确认静态检查通过

## 常见问题排查

### 问题 1：`pnpm db:up` 失败，提示无法连接 Docker

典型现象：

- `Cannot connect to the Docker daemon`
- `permission denied while trying to connect to the docker API`

处理方式：

1. 确认 Docker Desktop 已经启动
2. 再执行一次：

```bash
pnpm db:up
```

如果还是失败，再检查：

```bash
docker ps
```

### 问题 2：`3000`、`4321` 或 `5432` 端口被占用

先查哪个进程占了端口：

```bash
lsof -nP -iTCP:3000 -sTCP:LISTEN
lsof -nP -iTCP:4321 -sTCP:LISTEN
lsof -nP -iTCP:5432 -sTCP:LISTEN
```

如果你确认是旧的本地开发进程，可以先停掉对应进程，再重新启动服务。

### 问题 3：CMS 起不来，提示环境变量或数据库连接问题

先检查 `apps/cms/.env` 是否存在，且至少包含：

```bash
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/tzblog
PAYLOAD_SECRET=replace-me-with-a-long-secret
NEXT_PUBLIC_SERVER_URL=http://localhost:3000
```

再检查数据库是否已经启动：

```bash
pnpm db:up
pnpm db:logs
```

### 问题 4：前台能起，但内容和你预期不一样

这是当前阶段的正常现象。

原因是：

- 前台页面结构已经做出来了
- 但真实 Payload 内容模型和前后台数据链路还没全部接通

所以你现在看到的更多是“界面效果和内容契约”，不是完整 CMS 驱动站点。

### 问题 5：依赖安装后还是异常

先重新确认 lockfile 和依赖是否一致：

```bash
pnpm install
pnpm build
pnpm lint
```

## 可选操作

### 查看 PostgreSQL 日志

```bash
pnpm db:logs
```

### 重新拉代码后再启动

```bash
git pull --ff-only origin main
pnpm install
pnpm db:up
pnpm dev:cms
pnpm dev:web
```

### 重置本地数据库数据

这会删掉本地 PostgreSQL volume 中的数据，只在你明确要清空本地开发数据时使用：

```bash
docker compose -f infra/docker-compose.yml down -v
```

然后重新启动：

```bash
pnpm db:up
```

## 建议的日常工作流

如果你只是回来看看项目当前效果，最省事的流程是：

1. `cd /Users/baihaibin/Documents/WorkSpares/TZBlog`
2. `pnpm db:up`
3. 新终端运行 `pnpm dev:cms`
4. 新终端运行 `pnpm dev:web`
5. 打开 `http://localhost:4321`
6. 看完后分别 `Ctrl+C`
7. 最后执行 `pnpm db:down`

## 最后结论

下次如果你忘了怎么启动，不用重新翻整套项目文档，直接回到这份文档，按“最常用的启动方式”执行就够了。
