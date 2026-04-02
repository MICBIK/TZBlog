# Design: harden-cms-config-and-scripts

## 1. payload.config.ts 安全加固

### Secret 校验
```ts
const payloadSecret = process.env.PAYLOAD_SECRET
if (!payloadSecret) {
  throw new Error('PAYLOAD_SECRET environment variable is required')
}
```

### CORS/CSRF 环境变量驱动
```ts
const corsOrigins = (process.env.PAYLOAD_CORS_ORIGINS || 'http://localhost:4321')
  .split(',').map(s => s.trim()).filter(Boolean)
```
用于 `cors` 和 `csrf` 两个字段。

## 2. 合并 publish 脚本

合并 `tzblog-publish.mjs` 和 `tzblog-force-publish.mjs` 为单个脚本，通过 `--force` 区分行为。

## 3. 脚本路径修复

所有脚本使用 `import.meta.url` + `path.resolve` 替代硬编码绝对路径：
```js
import { fileURLToPath } from 'url'
import path from 'path'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '.env') })
const { default: config } = await import(path.resolve(__dirname, 'src/payload.config.ts'))
```

## 4. .env.example 更新

添加 `PAYLOAD_CORS_ORIGINS=http://localhost:4321` 说明。
