## Why

当前 `apps/cms` 的 Payload CMS 只有 `Users` 和 `Media` 两个基础 collection，没有任何内容模型。前台所有内容（文章、项目、文档、笔记）全部来自 `apps/web/src/data/content.ts` 的硬编码静态数据。

这意味着：
- 无法通过后台界面管理内容
- 无法支持草稿、版本、发布流程
- 内容和代码耦合，每次更新内容都要改代码

本 change 的目标是在 Payload CMS 中建立完整的内容 collection，让后台具备真实的内容管理能力。

## What Changes

- 新建 `Posts` collection（文章）
- 新建 `Projects` collection（项目）
- 新建 `Docs` collection（文档）
- 新建 `Notes` collection（笔记）
- 将四个 collection 注册到 `payload.config.ts`
- 所有 collection 开启草稿支持（`versions.drafts: true`）
- 所有 collection read access 公开，write 需要登录

## Capabilities

### Modified Capabilities

- `platform-foundation`: CMS 从仅有 Users/Media 升级为具备完整内容模型的后台系统

## Impact

- 仅影响 `apps/cms/src/` 目录
- 不影响前台 `apps/web`（前台数据链路由独立 change `connect-astro-to-payload-api` 处理）
- Payload 启动后会自动在 PostgreSQL 中创建对应表结构（migration）
- 需要 PostgreSQL 已启动（`docker compose up -d` 或本地 PG 实例）
- 详细字段设计见 `design.md` 和 `docs/TZBlog CMS数据链路实现方案.md`
