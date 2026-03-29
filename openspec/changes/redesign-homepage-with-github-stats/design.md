# Context

当前首页 6 个 section，信息过载且没有个人身份。目标是学 anna.tf 的极简思路：Hero 只回答"你是谁"，内容精选不铺满，每类入口只出现一次，新增 GitHub 活跃度和站点统计让首页有"活的感觉"。

# Goals / Non-Goals

**Goals**
- Hero 只展示个人身份（名字 + 角色 + 社交链接），删除抽象概念标题和多余 CTA
- 新增贡献热力图（cal-heatmap + GitHub GraphQL API）
- 新增开源项目卡片（实时 Star 数，GitHub REST API）
- 新增站点统计面板（Umami API）
- 删除所有重复的导航入口（Orbit Index / Mission Panels / Selected Works）
- 文章只展示最新 3 篇，项目只展示精选 1-2 个

**Non-Goals**
- 本轮不改列表页/详情页结构
- 本轮不引入重型 3D 效果或复杂动效
- 本轮不做后台管理界面（数据源先硬编码，后续接 Payload）

# Design Directions

## 1. 首页新结构（5 section）

```
┌────────────────────────────────┐
│  1. Hero - 个人身份                              │
│  "你好，我是 [名字]"                             │
│  "[一句话角色定位]"                               │
│  社交链接 (GitHub / Email / RSS)                 │
└─────────────────────────┘

┌─────────────────────────┐
│  2. GitHub Activity - 活跃度                     │
│  ┌──────────────────────────┐  │
│  │  贡献热力图 (cal-heatmap, 过去 12 个月)        │
│  └──────────────────────────┘  │
│  总贡献 XXX | 本周 XX | 最长连续 XX 天            │
│  ┌──────────────┐ ┌──────────────┐              │
│  │ TZBlog    5★ │ HD-Warp   5★ │  开源项目   │
│  └────────────┘ └──────────────┘              │
└────────────────────────────────┘

┌────────────────────────────────┐
│  3. Recent Posts - 最近文章                      │
│  • 文章标题 1                        2026-03-29 │
│  • 文章标题 2                        2026-03-27 │
│  • 文章标题 3                        2026-03-24 │
│  查看全部文章 →                                  │
└────────────────────────────────┘

┌────────────────────────────────┐
│  4. About / Tech Stack - 关于我                  │
│  [头像] 名字 | 角色                              │
│  简短 bio (1-2 句话)                              │
│  [Go] [Python] [Vue] [TypeScript] [Frida] ...   │
└─────────────────────────┘

┌─────────────────────────┐
│  5. Site Stats - 站点统计                        │
│  总访问 12,345 | 总访客 3,456                    │
│  今日访问 123  | 今日访客 45                     │
└────────────────────────────────┘
```

## 2. 技术细节

### 2.1 cal-heatmap 集成

**安装**:
```bash
pnpm add cal-heatmap
```

**组件接口** (`apps/web/src/components/ContributionGraph.astro`):
```astro
---
import ContributionCalendar from '../lib/cal-heatmap'
interface Props {
  username: string
  data: ContributionDay[]  // SSG 时预取
}
const { username, data } = Astro.props
---
<div id="cal-heatmap"></div>
<script is:inline>
  import ContributionCalendar from '../lib/cal-heatmap'
  const cal = new ContributionCalendar()
  cal.draw('#cal-heatmap', {
    data: { dates: data.reduce((acc, d) => ({...acc, [d.date]: d.count}), {}) },
    domain: { type: 'month', position: 'top' },
    range: 12,
    scale: { color: '#fff', emptyColor: 'rgba(25,25,0.05)' },
    tooltip: true,
  })
</script>
```

**GitHub GraphQL Query**:
```graphql
query GetUserContributions($username: String!) {
  user(login: $username) {
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks {
          contributionDays {
            date
            contributionCount
            contributionLevel
          }
        }
      }
    }
  }
}
```

**API 调用** (`apps/web/src/lib/github.ts`):
```typescript
export async function getContributionCalendar(username: string) {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: `...`,  // 上面 query
      variables: { username },
    }),
  })
  const json = await res.json()
  return json.data.user.contributionsCollection.contributionCalendar
}
```

### 2.2 开源项目 Star 数

**API 调用** (`apps/web/src/lib/github.ts`):
```typescript
export async function getRepoStats(owner: string, repo: string) {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`)
  const data = await res.json()
  return {
    name: data.name,
    description: data.description,
    stargazers_count: data.stargazers_count,
    language: data.language,
    html_url: data.html_url,
    updated_at: data.updated_at,
  }
}

// 批量获取（带速率限制处理）
export async function getReposStats(repos: Array<{owner: string, repo: string}>) {
  const results = []
  for (const r of repos) {
    try {
      results.push(await getRepoStats(r.owner, r.repo))
      await new Promise(resolve => setTimeout(resolve, 100))  // 避免 rate limit
    } catch (e) {
      console.error(`Failed to fetch ${r.repo}`, e)
    }
  }
  return results
}
```

**组件接口** (`apps/web/src/components/ProjectCard.astro`):
```astro
---
interface Props {
  name: string
  description: string
  stars: number
  language?: string
  url: string
}
const { name, description, stars, language, url } = Astro.props
---
<article class="project-card panel flow-sm">
  <div class="project-header">
    <h3><a href={url}>{name}</a></h3>
    <span class="star-badge">{stars.toLocaleString()} ★</span>
  </div>
  <p class="muted text-sm">{description}</p>
  <div class="project-meta">
    {language && <span class="language-tag">{language}</span>}
  </div>
</article>

<style>
.project-card { padding: 1.25rem; }
.project-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
.star-badge { background: rgba(255,255,0.1); padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.85em; }
</style>
```

### 2.3 Umami 站点统计

**API 调用** (`apps/web/src/lib/umami.ts`):
```typescript
interface UmamiStats {
  pageviews: number
  visitors: number
  visits: number
  bounces: number
  totaltime: number
}

export async function getUmamiStats(websiteId: string, startAt: number, endAt: number) {
  const res = await fetch(`${UMAMI_BASE_URL}/api/websites/${websiteId}/stats`, {
    headers: {
      'Authorization': `Bearer ${UMAMI_API_KEY}`,
      'Content-Type': 'application/json',
    },
  })
  return await res.json() as UmamiStats
}

// 今日数据（当天 0 点到现在）
export function getTodayRange() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const end = now.getTime()
  return { start, end }
}

// 总计数据（建站至今）
export function getAllTimeRange() {
  return { start: 1672531200, end: Date.now() }  // 2023-01-01 至今
}
```

**组件接口** (`apps/web/src/components/SiteStatsBar.astro`):
```astro
---
import { getUmamiStats, getTodayRange, getAllTimeRange } from '../lib/umami'
const websiteId = UMAMI_WEBSITE_ID
const today = getTodayRange()
const allTime = getAllTimeRange()
const [todayStats, allTimeStats] = await Promise.all([
  getUmamiStats(websiteId, today.start, today.end),
  getUmamiStats(websiteId, allTime.start, allTime.end),
])
---
<div class="site-stats-bar">
  <div class="stat-item">
    <span class="stat-value">{allTimeStats.pageviews.toLocaleString()}</span>
    <span class="stat-label">总访问</span>
  </div>
  <div class="stat-item">
    <span class="stat-value">{allTimeStats.visitors.toLocaleString()}</span>
    <span class="stat-label">总访客</span>
  </div>
  <div class="stat-item">
    <span class="stat-value">{todayStats.pageviews.toLocaleString()}</span>
    <span class="stat-label">今日访问</span>
  </div>
  <div class="stat-item">
    <span class="stat-value">{todayStats.visitors.toLocaleString()}</span>
    <span class="stat-label">今日访客</span>
  </div>
</div>
```

### 2.4 环境变量配置

`.env.example` 新增:
```bash
# GitHub API (可选，公开 repo 无需 token；私有 repo 或提高限流需要)
GITHUB_TOKEN=ghp_xxx

# Umami Analytics
UMAMI_BASE_URL=https://your-umami-instance.com
UMAMI_API_KEY=your-api-key
UMAMI_WEBSITE_ID=your-website-id
```

### 2.5 CSS 对齐规范

所有新增组件遵守现有设计系统：
- `.panel` 统一背景/边框/圆角
- `.flow-sm` / `.flow-md` / `.flow-lg` 统一间距
- `.eyebrow` / `.text-sm` / `.muted` 统一排版
- 颜色使用 CSS 变量 (`--bg`, `--panel`, `--border`, `--text`, `--muted`)
- 禁止 inline style，全部用 class

## 3. 数据流

```
┌────────────────────────────────┐
│  Astro SSG 构建时                                          │
│  1. apps/web/src/pages/index.astro.astro                   │
│     ├─ 调用 getContributionCalendar('MICBIK')              │
│     ├─ 调用 getReposStats([{owner:'MICBIK',repo:'TZBlog'}])│
│     └─ 调用 getUmamiStats(websiteId, ...)                  │
│  2. 数据内联到页面 HTML                                     │
│  3. cal-heatmap 在客户端渲染热力图                          │
└────────────────────────────────┘
```

**注意**:
- GitHub API 未认证限流 60 次/小时，认证后 5000 次/小时
- Umami API 需自托管实例或 Cloud 账号
- SSG 构建时数据是快照，如需实时更新可改用 Astro API route + client-side fetch

## 4. 渐进增强

- 无 JS 时热力图不显示，但项目卡片和站点统计仍可用（SSG 静态 HTML）
- 支持 `prefers-reduced-motion`，热力图无动画
- 移动端热力图横向滚动，不压缩

# Validation Plan

1. `astro check` - TypeScript 类型检查
2. `astro build` - 构建验证
3. 本地 `pnpm preview` 检查视觉效果（对齐/间距/响应式）
4. Lighthouse 性能评分（cal-heatmap ~15KB gzip，影响可控）
