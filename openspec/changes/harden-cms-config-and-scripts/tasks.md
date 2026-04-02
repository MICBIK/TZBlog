## 前置条件

> 需要 `apps/cms/.env` 中有 `PAYLOAD_SECRET` 值。

## 1. 加固 payload.config.ts

- [ ] 1.1 PAYLOAD_SECRET 缺失时 throw error
- [ ] 1.2 CORS/CSRF 改为读取 `PAYLOAD_CORS_ORIGINS` 环境变量
- [ ] 1.3 确认本地 `.env` 有 PAYLOAD_SECRET 值

## 2. 修复脚本路径

- [ ] 2.1 `tzblog-seed.mjs` 改用 `import.meta.url` 相对路径
- [ ] 2.2 合并 publish/force-publish 为单个 `tzblog-publish.mjs`，支持 `--force`
- [ ] 2.3 删除 `tzblog-force-publish.mjs`

## 3. 更新环境变量文档

- [ ] 3.1 `apps/cms/.env.example` 添加 `PAYLOAD_CORS_ORIGINS`

## 4. 收尾

- [ ] 4.1 提交 atomic commit
