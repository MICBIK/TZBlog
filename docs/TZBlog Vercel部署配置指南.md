# TZBlog 部署配置指南：Vercel + GitHub

## 一、前置条件

### 你需要准备的账号和信息

| 项目 | 说明 | 获取方式 |
|------|------|----------|
| GitHub 账号 | 仓库托管 | 已有（MICBIK） |
| Vercel 账号 | 部署平台 | https://vercel.com/signup （用 GitHub 登录） |
| PostgreSQL 云实例 | 生产数据库 | 推荐 Neon（免费层）或 Supabase |
| 域名（可选） | 自定义域名 | 任意域名注册商 |

### 需要你提供给我的信息（当你准备好部署时）

```
1. PostgreSQL 连接串：postgresql://user:pass@host:5432/tzblog
2. 自定义域名（如有）：例如 blog.example.com
3. Umami 实例地址和 API Key（如有）
4. GitHub Token（用于首页贡献图，当前已有）
```

---

## 二、GitHub 配置

### 2.1 推送仓库到 GitHub

如果仓库尚未关联远程：

```bash
git remote add origin https://github.com/MICBIK/TZBlog.git
git push -u origin main
```

### 2.2 GitHub Actions CI（已配置）

文件 `.github/workflows/ci.yml` 已创建。推送到 GitHub 后自动生效：
- 每次 push 到 main 或 PR → 自动运行 lint + test + build
- 无需额外配置

### 2.3 GitHub Secrets（后续 CD 用）

当 Vercel 部署配好后，如需在 CI 中触发部署，在 GitHub 仓库设置：

**Settings → Secrets and variables → Actions → New repository secret**

| Secret 名 | 值 | 用途 |
|-----------|-----|------|
| `VERCEL_TOKEN` | Vercel 个人 Token | CI 触发部署（可选） |
| `VERCEL_ORG_ID` | Vercel 团队/个人 ID | 项目标识 |
| `VERCEL_PROJECT_ID` | Vercel 项目 ID | 项目标识 |

> 注意：如果使用 Vercel 的 Git Integration（推荐），不需要这些 Secrets，Vercel 会自动监听 GitHub push 并部署。

---

## 三、Vercel 配置

### 3.1 创建 Vercel 项目

1. 登录 https://vercel.com
2. 点击 **Add New → Project**
3. 选择 **Import Git Repository → MICBIK/TZBlog**
4. Vercel 会自动检测到 monorepo

### 3.2 部署 CMS（Payload + Next.js）

创建第一个项目，配置如下：

| 设置项 | 值 |
|--------|-----|
| **Project Name** | `tzblog-cms` |
| **Framework Preset** | Next.js |
| **Root Directory** | `apps/cms` |
| **Build Command** | `pnpm build` |
| **Output Directory** | `.next` |
| **Install Command** | `pnpm install` |

**Environment Variables**（在 Vercel 项目 Settings → Environment Variables）：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `DATABASE_URL` | `postgresql://...` | 生产数据库连接串 |
| `PAYLOAD_SECRET` | 随机 32+ 字符串 | `openssl rand -hex 32` 生成 |
| `NEXT_PUBLIC_SERVER_URL` | `https://tzblog-cms.vercel.app` | CMS 公开地址 |
| `PAYLOAD_CORS_ORIGINS` | `https://你的博客域名` | 允许前台访问的域名 |

> 生成 PAYLOAD_SECRET：终端运行 `openssl rand -hex 32`

### 3.3 部署 Web（Astro 静态站）

创建第二个项目：

| 设置项 | 值 |
|--------|-----|
| **Project Name** | `tzblog-web` |
| **Framework Preset** | Astro |
| **Root Directory** | `apps/web` |
| **Build Command** | `pnpm build` |
| **Output Directory** | `dist` |
| **Install Command** | `pnpm install` |

**Environment Variables**：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `SITE_URL` | `https://你的博客域名` | 站点地址（用于 canonical URL 和 OG tags） |
| `PAYLOAD_API_URL` | `https://tzblog-cms.vercel.app/api` | CMS API 地址 |
| `GITHUB_TOKEN` | `ghp_...` | GitHub Personal Access Token（贡献图用） |
| `UMAMI_BASE_URL` | `https://你的umami地址` | Umami 实例（可选） |
| `UMAMI_API_KEY` | API Key | Umami API 密钥（可选） |
| `UMAMI_WEBSITE_ID` | 网站 ID | Umami 中注册的站点 ID（可选） |

### 3.4 自定义域名（可选）

在 Vercel 项目 **Settings → Domains**：
1. 添加你的域名，例如 `blog.example.com`
2. 按提示在域名注册商处添加 DNS 记录（CNAME 指向 `cname.vercel-dns.com`）
3. Vercel 自动签发 SSL 证书

### 3.5 构建触发

默认配置下：
- **Git Integration**：每次 push 到 main，Vercel 自动构建部署两个项目
- **Deploy Hook**（可选）：在 CMS 发布内容后触发 Web 重新构建

创建 Deploy Hook：
1. Vercel → tzblog-web 项目 → Settings → Git → Deploy Hooks
2. 创建一个 Hook，名为 `cms-publish`
3. 将 Hook URL 配置到 Payload CMS 的 Webhook 中（后续开发）

---

## 四、PostgreSQL 云数据库

### 推荐方案：Neon

1. 注册 https://neon.tech （GitHub 登录）
2. 创建项目 → 选择区域（推荐 `ap-southeast-1` 新加坡）
3. 获取连接串：`postgresql://user:pass@ep-xxx.ap-southeast-1.aws.neon.tech/tzblog?sslmode=require`
4. 填入 Vercel CMS 项目的 `DATABASE_URL`

**免费层**：0.5 GB 存储、每月 191 小时计算时间，足够博客使用。

### 备选方案：Supabase

1. 注册 https://supabase.com
2. 创建项目 → Settings → Database → Connection String
3. 免费层：500 MB 存储

---

## 五、部署后验证清单

```
[ ] CMS 部署成功：访问 https://tzblog-cms.vercel.app/admin 能看到登录页
[ ] 创建管理员账号：首次访问 /admin 会提示创建
[ ] Web 构建成功：访问 https://tzblog-web.vercel.app 能看到首页
[ ] 首页 GitHub 贡献图正常显示（需要 GITHUB_TOKEN）
[ ] About 页面数据正常
[ ] CMS 中创建一篇文章 → 重新触发 Web 构建 → 文章出现在前台
[ ] 自定义域名生效（如配置了）
[ ] SSL 证书正常（绿锁）
```

---

## 六、后续运维

### 内容更新流程

1. 登录 CMS 后台 → 编辑/发布内容
2. 触发 Web 重新构建（手动或 Webhook）
3. 新内容自动出现在前台

### 环境变量变更

在 Vercel Dashboard → 对应项目 → Settings → Environment Variables 修改，修改后需要 Redeploy。

### 数据库迁移

当 CMS Collection 结构变更时：
```bash
cd apps/cms
pnpm payload migrate:create
pnpm payload migrate
```

---

## 七、费用估算

| 服务 | 免费层 | 超出后 |
|------|--------|--------|
| Vercel (Hobby) | 无限静态站、100GB 带宽/月、Serverless Function | Pro $20/月 |
| Neon (Free) | 0.5GB 存储、191h/月计算 | Scale $19/月 |
| GitHub Actions | 2000 分钟/月（私有仓库） | $0.008/分钟 |
| **总计** | **$0/月** | 按需升级 |
