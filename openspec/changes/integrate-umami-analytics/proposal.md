## Why

Umami Analytics 代码已完整实现（`apps/web/src/lib/umami.ts`），首页已集成调用（`index.astro`），单元测试已通过（`umami.test.ts`），`.env.example` 已配置变量模板。但环境变量未填写实际值，Umami 实例尚未部署，站点统计面板显示全为 0。

当前是"代码就绪但运行时未激活"状态。本 change 的目标是完成 Umami 的运行时集成。

## What Changes

1. 部署 Umami 实例（Docker self-hosted 或 Umami Cloud）
2. 在 Umami 中注册 TZBlog 站点，获取 Website ID
3. 生成 API Key 用于服务端数据获取
4. 在前台页面 `<head>` 注入 Umami 客户端追踪脚本
5. 配置环境变量使首页统计面板正常工作

## Capabilities

### New Capabilities

- `site-analytics`: 站点访问统计与数据面板

## Impact

- 修改 `apps/web/src/layouts/SiteLayout.astro` — 注入 Umami 追踪脚本
- 修改 `.env` / `.env.example` — 配置 UMAMI_BASE_URL / UMAMI_API_KEY / UMAMI_WEBSITE_ID
- 可选：新增 `infra/docker-compose.umami.yml` — Umami self-hosted 部署配置
