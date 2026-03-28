## Why

TZBlog 当前只有设计和流程文档，还没有真正可运行的工程骨架。要进入持续开发，首先必须把 monorepo、前台 Astro、后台 Payload CMS 和本地 PostgreSQL 开发环境落下来，形成第一条最小可运行链路。

## What Changes

- 建立 `pnpm workspace + turbo` 的 monorepo 基础结构
- 初始化 `apps/web` 的 Astro 应用，提供最小首页和文章详情页占位骨架
- 初始化 `apps/cms` 的 Payload 应用，接通 PostgreSQL 环境变量和基础启动能力
- 建立本地 `infra/docker-compose.yml`，提供 PostgreSQL 开发环境
- 补充根级脚本、环境变量模板和启动说明，使仓库可以被后续 AI / 人类开发者直接接管

## Capabilities

### New Capabilities
- `workspace-bootstrap`: 提供 TZBlog 的本地开发基础工程结构、应用骨架和数据库运行入口

### Modified Capabilities

## Impact

- 新增应用代码目录 `apps/web`、`apps/cms`
- 新增 `infra/` 与本地 PostgreSQL 运行配置
- 新增根级 workspace / turbo / package manager 配置
- 更新 README、项目索引和接管文档中的开发状态与启动方式
