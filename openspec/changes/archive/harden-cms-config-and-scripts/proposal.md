## Why

CMS 存在多个安全和可维护性问题：

1. `PAYLOAD_SECRET` 缺失时回退空字符串，导致 session/token 签名在非开发环境中被攻破
2. CORS/CSRF 硬编码 `localhost:4321`，部署生产环境时无法使用
3. 三个工具脚本（seed/publish/force-publish）硬编码开发者机器绝对路径，换环境即崩溃
4. `tzblog-publish.mjs` 与 `tzblog-force-publish.mjs` 功能重复

## What Changes

1. `payload.config.ts`：PAYLOAD_SECRET 缺失时 throw error；CORS/CSRF 改为环境变量驱动
2. 合并 publish 和 force-publish 为单个 `tzblog-publish.mjs`，支持 `--force` 参数
3. 所有脚本改用相对路径（`path.resolve` + `import.meta.url`）
4. 更新 `.env.example` 添加 `PAYLOAD_CORS_ORIGINS` 说明

## Capabilities

### Modified Capabilities

- `platform-foundation`：CMS 安全配置从开发级提升为可部署级

## Impact

- 影响 `apps/cms/` 下 4 个文件
- 不影响前台
- 本地开发需确保 `.env` 中有 `PAYLOAD_SECRET`
