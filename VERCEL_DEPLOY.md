# Vercel 部署配置

## 1. CMS 部署配置

**Project Name**: `tzblog-cms`
**Framework**: Other
**Root Directory**: `apps/cms`
**Build Command**: `cd ../.. && pnpm build --filter cms`
**Output Directory**: `dist`
**Install Command**: `pnpm install`

### 环境变量

```bash
# 必需
DATABASE_URI=postgresql://neondb_owner:npg_KSVA5l7BmUHL@ep-shy-cell-a1hizjrf-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
PAYLOAD_SECRET=<生成一个随机字符串，至少32位>

# 可选 - S3/R2 媒体存储
S3_BUCKET=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_REGION=auto
S3_ENDPOINT=
```

生成 PAYLOAD_SECRET：
```bash
openssl rand -base64 32
```

---

## 2. Web 部署配置

**Project Name**: `tzblog-web`
**Framework**: Astro
**Root Directory**: `apps/web`
**Build Command**: `cd ../.. && pnpm build --filter web`
**Output Directory**: `dist`
**Install Command**: `pnpm install`

### 环境变量

```bash
# 必需 - 等 CMS 部署完成后填写
PAYLOAD_API_URL=https://tzblog-cms.vercel.app

# 可选 - Umami Analytics
UMAMI_BASE_URL=
UMAMI_TRACKING_URL=
UMAMI_WEBSITE_ID=
UMAMI_API_KEY=

# 可选 - Vercel Deploy Hook
VERCEL_DEPLOY_HOOK_URL=
```

---

## 部署步骤

1. 访问 https://vercel.com/new
2. 导入 GitHub 仓库（如果还没推送，先 `git push origin main`）
3. 先部署 CMS：
   - 选择 `apps/cms` 作为 Root Directory
   - 配置上述环境变量
   - 部署完成后复制 URL
4. 再部署 Web：
   - 选择 `apps/web` 作为 Root Directory
   - 配置 `PAYLOAD_API_URL` 为 CMS 的 URL
   - 部署

---

## Neon 数据库连接串

```
postgresql://neondb_owner:npg_KSVA5l7BmUHL@ep-shy-cell-a1hizjrf-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```
