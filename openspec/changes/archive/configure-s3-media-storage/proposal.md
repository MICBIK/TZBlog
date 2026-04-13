## Why

当前 `apps/cms/src/collections/Media.ts` 配置 `upload: true`，使用 Payload 默认的本地文件系统存储。项目技术栈明确要求使用 S3/R2 兼容存储（见 `openspec/project.md`），本地存储在 Vercel Serverless 环境下无法持久化。

## What Changes

1. 安装 `@payloadcms/storage-s3` 插件
2. 在 `payload.config.ts` 配置 S3 adapter（兼容 Cloudflare R2）
3. 更新 `Media.ts` 设置合理的文件大小限制和 MIME 类型白名单
4. 更新 `.env.example` 增加 S3 相关环境变量

## Capabilities

### New Capabilities

- `cloud-media-storage`: 媒体文件持久化到 S3/R2 云存储

## Impact

- 新增依赖 `@payloadcms/storage-s3`
- 修改 `apps/cms/src/payload.config.ts` — 添加 S3 storage plugin
- 修改 `apps/cms/src/collections/Media.ts` — 文件限制配置
- 修改 `.env.example` — S3 环境变量
