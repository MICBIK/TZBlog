# TZBlog 部署文档

## 项目架构

- **CMS**: Payload CMS 3.80.0 + Next.js 16.2.1 (apps/cms)
- **Web**: Astro 6.1 静态站点 (apps/web)
- **数据库**: Neon PostgreSQL (Serverless)
- **部署平台**: Vercel
- **存储**: S3 兼容对象存储 (可选)

## 数据库配置

### Neon PostgreSQL

1. 创建 Neon 项目: https://neon.tech
2. 获取连接字符串 (Pooled connection):
   ```
   postgresql://[user]:[password]@[host]-pooler.region.aws.neon.tech/[dbname]?sslmode=require&channel_binding=require
   ```
3. 初始化数据库 schema:
   ```bash
   cd apps/cms
   DATABASE_URL="your_connection_string" npm run payload migrate
   ```

## CMS 部署 (apps/cms)

### 环境变量

在 Vercel 项目中配置以下环境变量:

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `DATABASE_URL` | Neon PostgreSQL 连接字符串 | `postgresql://...` |
| `PAYLOAD_SECRET` | Payload 密钥 (随机字符串) | `your-secret-key-here` |
| `NEXT_PUBLIC_SERVER_URL` | CMS 公开访问地址 | `https://cms-gold-five.vercel.app` |
| `PAYLOAD_CORS_ORIGINS` | 允许的 CORS 来源 (逗号分隔) | `https://your-web-domain.com` |
| `S3_BUCKET` | S3 存储桶名称 (可选) | `my-bucket` |
| `S3_ACCESS_KEY_ID` | S3 访问密钥 (可选) | - |
| `S3_SECRET_ACCESS_KEY` | S3 密钥 (可选) | - |
| `S3_REGION` | S3 区域 (可选) | `auto` |
| `S3_ENDPOINT` | S3 端点 (可选) | `https://...` |

### 部署步骤

1. 安装 Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. 链接项目 (首次):
   ```bash
   cd apps/cms
   vercel link
   ```

3. 配置环境变量:
   ```bash
   vercel env add DATABASE_URL production
   vercel env add PAYLOAD_SECRET production
   vercel env add NEXT_PUBLIC_SERVER_URL production
   vercel env add PAYLOAD_CORS_ORIGINS production
   ```

4. 部署到生产环境:
   ```bash
   vercel --prod
   ```

5. 部署完成后访问 `/admin` 创建管理员账号

### 中文本地化

CMS 已配置中文界面:
- 核心 UI: 使用 `@payloadcms/translations/languages/zh`
- 自定义 Collections/Globals: 通过 `labels` 字段配置中文名称

## Web 部署 (apps/web)

### 环境变量

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `PAYLOAD_API_URL` | CMS API 地址 | `https://cms-gold-five.vercel.app/api` |

### 部署步骤

1. 链接项目 (首次):
   ```bash
   cd apps/web
   vercel link
   ```

2. 配置环境变量:
   ```bash
   vercel env add PAYLOAD_API_URL production
   ```

3. 部署到生产环境:
   ```bash
   vercel --prod
   ```

### 构建说明

- Web 项目在构建时会调用 CMS API 获取数据
- 使用 SSG (Static Site Generation) 生成静态页面
- 如果 API 调用失败，会返回空数据结构 (不会中断构建)

## 触发重新部署

### 自动触发

CMS 配置了 `afterChange` hook，当以下 collection 发生变化时会自动触发 Web 重新部署:
- Posts
- Projects
- Docs
- Notes

实现位置: `apps/cms/src/hooks/triggerDeploy.ts`

### 手动触发

```bash
# 重新部署 CMS
cd apps/cms
vercel --prod

# 重新部署 Web
cd apps/web
vercel --prod
```

## 常见问题

### 1. 数据库表不存在

**错误**: `relation 'xxx' does not exist`

**解决**:
```bash
cd apps/cms
DATABASE_URL="your_connection_string" npm run payload migrate
```

### 2. Web 构建时 API 404

**原因**: `PAYLOAD_API_URL` 未配置或配置错误

**解决**: 检查环境变量是否正确设置为 CMS 的 `/api` 端点

### 3. CORS 错误

**原因**: CMS 的 `PAYLOAD_CORS_ORIGINS` 未包含 Web 域名

**解决**: 更新环境变量:
```bash
vercel env rm PAYLOAD_CORS_ORIGINS production
vercel env add PAYLOAD_CORS_ORIGINS production
# 输入: https://your-web-domain.com,https://cms-gold-five.vercel.app
```

### 4. 侧边栏显示英文

**原因**: Collection/Global 未配置 `labels` 字段

**解决**: 在对应的 collection 配置文件中添加:
```typescript
export const YourCollection: CollectionConfig = {
  slug: 'your-collection',
  labels: {
    singular: '中文单数',
    plural: '中文复数',
  },
  // ...
}
```

## 项目 URL

- **CMS Admin**: https://cms-gold-five.vercel.app/admin
- **CMS API**: https://cms-gold-five.vercel.app/api
- **Web**: (根据实际部署配置)

## 维护建议

1. **定期备份数据库**: Neon 提供自动备份，建议启用
2. **监控 API 调用**: 检查 Vercel 函数调用量和响应时间
3. **更新依赖**: 定期运行 `npm update` 更新依赖包
4. **日志查看**: 使用 `vercel logs` 查看运行时日志
