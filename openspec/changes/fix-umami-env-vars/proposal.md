## Why

根据生产环境调试和代码审计，确认 Umami Analytics 统计数据显示为 0 的根本原因：

### 问题现象

**位置**：首页"站点统计"区域（`apps/web/src/pages/index.astro` + `apps/web/src/components/SiteStatsBar.astro`）

**表现**：
- 总访问：0
- 总访客：0
- 今日访问：0
- 今日访客：0

### 根因分析 ✓ 已确认

**核心问题**：Astro SSG 模式下，`import.meta.env.UMAMI_*` 环境变量在构建时无法访问，导致：

1. **Umami 追踪脚本未注入**
   - **位置**：`apps/web/src/layouts/BaseLayout.astro:42-43`
   - **代码**：
     ```astro
     {import.meta.env.UMAMI_SCRIPT_URL && import.meta.env.UMAMI_WEBSITE_ID && (
       <script defer src={import.meta.env.UMAMI_SCRIPT_URL} data-website-id={import.meta.env.UMAMI_WEBSITE_ID} is:inline></script>
     )}
     ```
   - **实际结果**：条件判断为 `false`（变量为 `undefined`），脚本未渲染到 HTML

2. **API 调用返回空数据**
   - **位置**：`apps/web/src/lib/umami.ts:66-98`
   - **代码**：
     ```ts
     export async function getUmamiStats(...): Promise<UmamiStats> {
       if (!UMAMI_BASE_URL || !UMAMI_API_KEY || !websiteId) {
         return EMPTY_UMAMI_STATS  // ← 命中 guard clause，返回全 0
       }
       // ...
     }
     ```
   - **实际结果**：`UMAMI_BASE_URL` 和 `UMAMI_API_KEY` 在构建时为 `undefined`，直接返回 `{ pageviews: 0, visitors: 0, ... }`

### 技术原因

**Astro 环境变量访问规则**（官方文档）：
- ✅ **`PUBLIC_` 前缀变量**：可在客户端和服务端访问（通过 `import.meta.env.PUBLIC_*`）
- ❌ **无前缀变量**：仅在服务端（SSR）可访问，SSG 构建时为 `undefined`

**当前配置**：
- Vercel 环境变量：`UMAMI_BASE_URL`, `UMAMI_API_KEY`, `UMAMI_WEBSITE_ID`, `UMAMI_SCRIPT_URL`（无 `PUBLIC_` 前缀）
- 代码访问方式：`import.meta.env.UMAMI_*`（期望客户端可见）
- **结果**：构建时变量未注入，生成的静态 HTML 中脚本缺失，API 调用返回空数据

### 验证证据

1. **生产环境 HTML 源码检查**（部署 `web-i6ol586ud`）：
   - `<head>` 中无 Umami 脚本标签
   - 站点统计区域显示 `<span class="site-stat-value">0</span>`

2. **Vercel 环境变量配置**：
   - 所有 `UMAMI_*` 变量已配置到 Production + Preview + Development 三个环境
   - 但变量名缺少 `PUBLIC_` 前缀，Astro 构建时无法访问

## What Changes

### 方案：采用 `PUBLIC_` 前缀（符合 Astro 最佳实践）

#### 1. Vercel 环境变量配置

**新增 4 个带 `PUBLIC_` 前缀的环境变量**（保留旧变量以防其他地方使用）：

| 变量名 | 值 | 环境 |
|---|---|---|
| `PUBLIC_UMAMI_BASE_URL` | `https://cloud.umami.is` | Production + Preview + Development |
| `PUBLIC_UMAMI_API_KEY` | `api_rAvZhHJwnycvovEyoiGRomOfy82YNPxk` | Production + Preview + Development |
| `PUBLIC_UMAMI_WEBSITE_ID` | `8a2f9396-d57e-451f-b312-7f2b4074dd78` | Production + Preview + Development |
| `PUBLIC_UMAMI_SCRIPT_URL` | `https://cloud.umami.is/script.js` | Production + Preview + Development |

#### 2. 代码修改

**文件 1：`apps/web/src/layouts/BaseLayout.astro`**

```diff
- {import.meta.env.UMAMI_SCRIPT_URL && import.meta.env.UMAMI_WEBSITE_ID && (
-   <script defer src={import.meta.env.UMAMI_SCRIPT_URL} data-website-id={import.meta.env.UMAMI_WEBSITE_ID} is:inline></script>
+ {import.meta.env.PUBLIC_UMAMI_SCRIPT_URL && import.meta.env.PUBLIC_UMAMI_WEBSITE_ID && (
+   <script defer src={import.meta.env.PUBLIC_UMAMI_SCRIPT_URL} data-website-id={import.meta.env.PUBLIC_UMAMI_WEBSITE_ID} is:inline></script>
 )}
```

**文件 2：`apps/web/src/lib/umami.ts`**

```diff
- const UMAMI_BASE_URL = import.meta.env.UMAMI_BASE_URL || ''
- const UMAMI_API_KEY = import.meta.env.UMAMI_API_KEY || ''
+ const UMAMI_BASE_URL = import.meta.env.PUBLIC_UMAMI_BASE_URL || ''
+ const UMAMI_API_KEY = import.meta.env.PUBLIC_UMAMI_API_KEY || ''
```

**文件 3：`apps/web/src/pages/index.astro`**（调用 `getUmamiStats` 时传入 `websiteId`）

```diff
 const allTimeStats = await getUmamiStats(
-  import.meta.env.UMAMI_WEBSITE_ID || '',
+  import.meta.env.PUBLIC_UMAMI_WEBSITE_ID || '',
   allTimeRange.start,
   allTimeRange.end,
 )
 const todayStats = await getUmamiStats(
-  import.meta.env.UMAMI_WEBSITE_ID || '',
+  import.meta.env.PUBLIC_UMAMI_WEBSITE_ID || '',
   todayRange.start,
   todayRange.end,
 )
```

#### 3. 环境变量文档更新

**文件：`.env.example`**（根目录或 `apps/web/.env.example`）

```diff
 # Umami Analytics
- UMAMI_BASE_URL=
- UMAMI_API_KEY=
- UMAMI_WEBSITE_ID=
- UMAMI_SCRIPT_URL=
+ PUBLIC_UMAMI_BASE_URL=https://cloud.umami.is
+ PUBLIC_UMAMI_API_KEY=your-api-key
+ PUBLIC_UMAMI_WEBSITE_ID=your-website-id
+ PUBLIC_UMAMI_SCRIPT_URL=https://cloud.umami.is/script.js
```

## Capabilities

### Modified Capabilities

- `analytics-integration`：修复 Umami Analytics 环境变量访问问题，使站点统计功能正常工作

## Impact

### 前端
- **影响文件**：3 个
  - `apps/web/src/layouts/BaseLayout.astro`（1 行修改）
  - `apps/web/src/lib/umami.ts`（2 行修改）
  - `apps/web/src/pages/index.astro`（2 处修改）
- **构建要求**：需要重新构建前端（`pnpm build --filter web`）
- **部署要求**：需要重新部署到 Vercel

### 环境变量
- **Vercel 配置**：新增 4 个 `PUBLIC_` 前缀变量
- **向后兼容**：保留旧的 `UMAMI_*` 变量（如果其他地方使用）
- **本地开发**：需要更新 `.env` 文件

### 风险评估
- **低风险**：仅修改环境变量访问方式，无业务逻辑变更
- **无破坏性变更**：不影响现有功能
- **即时生效**：部署后立即开始采集数据（但历史数据为 0 是正常的）

### 预期结果

部署后：
1. ✅ Umami 追踪脚本成功注入到 `<head>` 标签
2. ✅ 站点统计 API 正常调用 Umami Cloud
3. ✅ 首页显示实时访问数据（初期可能为 0，需要访问量积累）
4. ✅ 浏览器开发者工具 Network 面板可见 `https://cloud.umami.is/api/send` 请求

### 验证方法

```bash
# 1. 检查最新部署的 HTML 源码
vercel curl / --deployment <latest-deployment-url> | grep "cloud.umami.is"

# 2. 预期输出（脚本已注入）
<script defer src="https://cloud.umami.is/script.js" data-website-id="8a2f9396-d57e-451f-b312-7f2b4074dd78" is:inline></script>

# 3. 访问生产站点，打开浏览器开发者工具 Console
# 预期：无 Umami 相关错误日志

# 4. 检查 Network 面板
# 预期：可见 POST https://cloud.umami.is/api/send 请求（状态码 200）
```
