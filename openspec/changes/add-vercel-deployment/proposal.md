## Why

项目有完整的 Vercel 部署文档（`docs/TZBlog Vercel部署配置指南.md`），但缺少实际的部署配置文件。当前无法一键部署到 Vercel：

1. 缺少 `vercel.json` 构建配置
2. CMS（Payload + Next.js）和 Web（Astro）作为 monorepo 中的两个子项目，需要分别配置
3. 缺少 CMS 发布内容后自动触发 Web 重新构建的 Webhook 机制

## What Changes

1. 创建 `apps/web/vercel.json` — Astro 静态站部署配置
2. 创建 `apps/cms/vercel.json` — Payload CMS Serverless 部署配置
3. 在 Payload CMS 中添加 afterChange hook，在内容发布时触发 Vercel Deploy Hook
4. 更新 `.env.example` 增加 `VERCEL_DEPLOY_HOOK_URL`

## Capabilities

### New Capabilities

- `production-deployment`: Vercel 一键部署 + CMS 发布自动触发构建

## Impact

- 新增 `apps/web/vercel.json`
- 新增 `apps/cms/vercel.json`
- 修改 `apps/cms/src/payload.config.ts` — 添加 afterChange deploy hook
- 修改 `.env.example` — 新增 VERCEL_DEPLOY_HOOK_URL
