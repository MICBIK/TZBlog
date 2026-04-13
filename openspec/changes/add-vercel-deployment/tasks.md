## 1. 基线与准备

- [x] 1.1 确认当前 monorepo 构建命令（turbo.json / package.json scripts）
- [x] 1.2 确认 Astro 和 Payload 的 output 目录

## 2. Vercel 配置

- [x] 2.1 创建 `apps/web/vercel.json`：framework=astro, buildCommand, outputDirectory
- [x] 2.2 创建 `apps/cms/vercel.json`：framework=nextjs, buildCommand, outputDirectory
- [x] 2.3 更新 `.env.example` 增加 `VERCEL_DEPLOY_HOOK_URL`

## 3. Deploy Hook

- [x] 3.1 在 `apps/cms/src/hooks/` 创建 `triggerDeploy.ts` — 调用 Vercel Deploy Hook URL
- [x] 3.2 在 `payload.config.ts` 为内容 collection 注册 afterChange hook

## 4. 验证

- [x] 4.1 本地构建两个子项目正常
- [x] 4.2 Deploy hook 函数逻辑正确（环境变量缺失时静默跳过）
- [ ] 4.3 更新部署文档反映新增配置
