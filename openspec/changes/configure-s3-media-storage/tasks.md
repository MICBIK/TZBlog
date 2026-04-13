## 1. 基线与准备

- [ ] 1.1 确认 Payload CMS 版本对 `@payloadcms/storage-s3` 的兼容性
- [ ] 1.2 确认当前 Media collection 字段定义

## 2. 实现

- [ ] 2.1 安装 `@payloadcms/storage-s3`
- [ ] 2.2 在 `payload.config.ts` plugins 数组添加 S3 storage adapter 配置
- [ ] 2.3 更新 `Media.ts`：增加文件大小限制（10MB）和 MIME 类型白名单
- [ ] 2.4 更新 `.env.example` 增加 `S3_BUCKET` / `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` / `S3_REGION` / `S3_ENDPOINT`

## 3. 验证

- [ ] 3.1 CMS 启动正常（无 S3 配置时降级为本地存储）
- [ ] 3.2 TypeScript 类型检查通过
- [ ] 3.3 文档中记录 R2 兼容配置方式
