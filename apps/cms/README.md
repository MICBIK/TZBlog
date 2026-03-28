# TZBlog CMS

`apps/cms` 是 TZBlog 的 Payload CMS 应用。

## 当前职责

- 提供 Payload Admin 入口
- 承载后续 `posts / projects / docs / notes / pages`
- 管理媒体、站点配置和发布数据

## 本地启动

1. 在仓库根目录执行 `cp .env.example .env`
2. 在 `apps/cms` 内执行 `cp .env.example .env`
3. 在仓库根目录执行 `pnpm db:up`
4. 在仓库根目录执行 `pnpm install`
5. 在仓库根目录执行 `pnpm dev:cms`

默认访问地址：

- `http://localhost:3000`
- Admin: `http://localhost:3000/admin`

## 当前状态

- 已切到 PostgreSQL 连接方式
- 暂时只保留 `Users` 和 `Media` 两个官方基础 collection
- 后续会在下一轮变更中补完整内容模型和 globals
