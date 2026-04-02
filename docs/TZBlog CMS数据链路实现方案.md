# TZBlog CMS 数据链路实现方案

> 版本：v1.0 · 2026-03-30
> 适用范围：`apps/cms` Payload CMS collections 建立 + `apps/web` Astro 前台数据链路接入
> 前置条件：monorepo 已建立，Payload CMS 骨架已初始化，PostgreSQL 可用

---

## 一、背景与目标

当前 TZBlog 前台（`apps/web`）所有内容均为硬编码静态数据，存放在 `apps/web/src/data/content.ts`。后台（`apps/cms`）只有 `Users` 和 `Media` 两个基础 collection，没有任何内容模型。

本方案的目标是：

1. 在 Payload CMS 中建立 `posts / projects / docs / notes` 四个内容 collection
2. 将 Astro 前台的数据来源从 `content.ts` 静态数据切换为 Payload REST API
3. 保持前台页面结构、路由、组件主体不变，只替换内容数据来源
4. API 不可用时明确渲染空集合 / empty state，而不是偷偷回退到示例内容

---

## 二、现有数据结构分析

前台 `content.ts` 中已定义了完整的 TypeScript 类型，是 Payload collections 字段设计的直接参考依据。

### PostEntry（文章）

```ts
type PostEntry = {
  slug: string           // URL 标识符，唯一
  title: string          // 标题
  summary: string        // 摘要
  category: string       // 分类
  orbit: string          // 副标题/轨道标签
  publishedAt: string    // 发布日期 ISO 格式
  readTime: string       // 阅读时间，如 "8 min"
  tags: string[]         // 标签数组
  featured?: boolean     // 是否精选
  sections: SectionBlock[] // 正文区块数组
}
```

### ProjectEntry（项目）

```ts
type ProjectEntry = {
  slug: string
  title: string
  summary: string
  stage: string          // 阶段，如 "In Progress" / "Planned" / "Concept"
  orbit: string
  updatedAt: string
  stack: string[]        // 技术栈数组
  tags: string[]
  featured?: boolean
  links: { label: string; href: string }[]  // 外部链接
  highlights: string[]   // 亮点列表
  sections: SectionBlock[]
}
```

### DocEntry（文档）

```ts
type DocEntry = {
  slug: string
  title: string
  summary: string
  version: string        // 版本号，如 "v0.2"
  orbit: string
  updatedAt: string
  tags: string[]
  sections: SectionBlock[]
}
```

### NoteEntry（笔记）

```ts
type NoteEntry = {
  slug: string
  title: string
  summary: string
  publishedAt: string
  mood: string           // 情绪/类型标签，如 "Ship Log" / "Short Note"
  tags: string[]
  sections: SectionBlock[]
}
```

### SectionBlock（正文区块，所有 collection 共用）

```ts
type SectionBlock = {
  id: string             // 区块 ID，用于目录锚点
  title: string          // 区块标题
  paragraphs: string[]   // 段落数组
  bullets?: string[]     // 可选要点列表
}
```

---

## 三、Payload CMS Collections 设计

### 3.1 通用说明

- 所有 collection 的 `slug` 字段必须唯一，作为前台路由参数
- `sections` 使用 Payload 的 `array` 字段类型实现
- 所有 collection 开启草稿（`versions.drafts`）支持
- 所有 collection 的 read access 设为公开（`() => true`），write 显式要求登录用户
- `tags` / `stack` / `highlights` 使用 `array` of `text` 实现

### 3.2 Posts Collection

文件路径：`apps/cms/src/collections/Posts.ts`

### 3.3 Projects Collection

文件路径：`apps/cms/src/collections/Projects.ts`

### 3.4 Docs Collection

文件路径：`apps/cms/src/collections/Docs.ts`

### 3.5 Notes Collection

文件路径：`apps/cms/src/collections/Notes.ts`

### 3.6 注册到 payload.config.ts

```ts
// apps/cms/src/payload.config.ts
import { Posts } from './collections/Posts'
import { Projects } from './collections/Projects'
import { Docs } from './collections/Docs'
import { Notes } from './collections/Notes'

collections: [Users, Media, Posts, Projects, Docs, Notes]
```

---

## 四、Astro 前台数据链路设计

### 4.1 总体原则

- 所有前台内容页面统一经由 `apps/web/src/lib/payload.ts` 获取数据
- 页面和组件不直接裸写 Payload API URL
- 所有查询默认过滤 `published` 内容
- API 不可用时返回空集合，前台渲染 empty state，而不是回退示例内容

### 4.2 API 层职责

`payload.ts` 负责：

- 拼接 API URL
- 统一错误处理
- 将 Payload 的 array / sections 结构展平成前台需要的类型
- 提供 `getPosts / getProjects / getDocs / getNotes` 等主读函数；`getPostBySlug / getProjectBySlug / getDocBySlug / getNoteBySlug` 仍保留为 helper，但已不再作为当前详情页主链路

### 4.3 基础请求函数（含空集合降级）

```ts
const API_URL = import.meta.env.PAYLOAD_API_URL || `${import.meta.env.PAYLOAD_PUBLIC_URL || 'http://localhost:3000'}/api`

async function fetchPayload<T>(path: string): Promise<T> {
  try {
    const res = await fetch(`${API_URL}${path}`)
    if (!res.ok) throw new Error(`${res.status}`)
    return res.json()
  } catch (err) {
    console.warn(`[payload] API unavailable: ${path}`, err)
    return { docs: [] } as T
  }
}
```

---

## 五、页面改造策略

### 5.1 列表页统一模式

```astro
---
import { getPosts } from '../../lib/payload'
const posts = await getPosts()
---
```

### 5.2 详情页统一模式

```astro
---
import { getPosts } from '../../lib/payload'
export async function getStaticPaths() {
  const posts = await getPosts()
  return posts.map((post) => ({ params: { slug: post.slug }, props: { post } }))
}
const { post: currentPost } = Astro.props
---
```

### 5.3 需要改造的文件清单

| 文件 | 改动类型 | 涉及函数 |
|------|---------|----------|
| `src/pages/posts/index.astro` | 数据来源替换 | `getPosts()` |
| `src/pages/posts/[slug].astro` | 数据来源替换 | `getPosts()` + props 直传 |
| `src/pages/projects/index.astro` | 数据来源替换 | `getProjects()` |
| `src/pages/projects/[slug].astro` | 数据来源替换 | `getProjects()` + props 直传 |
| `src/pages/docs/index.astro` | 数据来源替换 | `getDocs()` |
| `src/pages/docs/[slug].astro` | 数据来源替换 | `getDocs()` + props 直传 |
| `src/pages/notes/index.astro` | 数据来源替换 | `getNotes()` |
| `src/pages/notes/[slug].astro` | 数据来源替换 | `getNotes()` + props 直传 |
| `src/pages/index.astro` | 局部替换 | `getPosts()` 取最新3篇 |
| `src/pages/search/index.astro` | 动态索引 | `getPosts()` / `getProjects()` / `getDocs()` / `getNotes()` |

### 5.4 首页改造说明

当前主线首页已经固定为 5 段结构（Hero / GitHub Activity / Recent Posts / About / Site Stats）。
本次数据链路改造只替换其中“Recent Posts”区块的数据来源，不再改动首页其余结构。

```astro
---
import { getPosts } from '../lib/payload'
const allPosts = await getPosts()
const latestPosts = allPosts.slice(0, 3)
---
```

### 5.5 搜索页改造说明

```astro
---
import { getPosts, getProjects, getDocs, getNotes } from '../../lib/payload'
const [posts, projects, docs, notes] = await Promise.all([
  getPosts(), getProjects(), getDocs(), getNotes()
])
const searchIndex = [
  ...posts.map(item => ({ type: '文章', title: item.title, summary: item.summary, href: `/posts/${item.slug}`, meta: `${item.publishedAt} · ${item.readTime}` })),
  ...projects.map(item => ({ type: '项目', title: item.title, summary: item.summary, href: `/projects/${item.slug}`, meta: `${item.stage} · ${item.updatedAt}` })),
  ...docs.map(item => ({ type: '文档', title: item.title, summary: item.summary, href: `/docs/${item.slug}`, meta: `${item.version} · ${item.updatedAt}` })),
  ...notes.map(item => ({ type: '笔记', title: item.title, summary: item.summary, href: `/notes/${item.slug}`, meta: `${item.mood} · ${item.publishedAt}` })),
]
---
```

---

## 六、错误处理与降级策略

### 6.1 构建时 API 不可用

如果构建时 Payload 不可用，前台不应再回退到静态示例内容，否则会制造“看起来接通了 CMS、其实仍在吃假数据”的错觉。

当前实现使用空集合降级策略：

```ts
async function fetchPayload<T>(path: string): Promise<T> {
  try {
    const res = await fetch(`${API_URL}${path}`)
    if (!res.ok) throw new Error(`${res.status}`)
    return res.json()
  } catch (err) {
    console.warn(`[payload] API unavailable: ${path}`, err)
    return { docs: [] } as T
  }
}
```

### 6.2 详情页路径与 slug 行为

当前详情页不再在页面内部调用 `getPostBySlug` / `getProjectBySlug` / `getDocBySlug` / `getNoteBySlug` 做二次请求；静态路径和页面 props 统一由 `getStaticPaths()` 决定。

当 API 不可用时，`getStaticPaths()` 会返回空路径集合，因此不会生成伪造详情页。

---

## 七、执行顺序与验证标准

### 7.1 推荐执行顺序

```text
Step 1: 启动 PostgreSQL（docker compose up -d postgres）
Step 2: 启动 Payload CMS（cd apps/cms && pnpm dev）
Step 3: 首次访问 http://localhost:3000/admin，创建管理员账号
Step 4: 实现 Posts / Projects / Docs / Notes collections
Step 5: 在 Payload Admin 创建测试数据并发布
Step 6: 验证 REST API：GET http://localhost:3000/api/<collection>
Step 7: 创建 apps/web/src/lib/payload.ts
Step 8: 改造列表页与详情页
Step 9: 改造首页 Recent Posts 与搜索页
Step 10: 运行 astro check + astro build，确认 0 errors
```

### 7.2 每个 collection 的验证标准

- [ ] Payload Admin 能创建、编辑、发布该 collection 的内容
- [ ] `GET /api/<collection>` 返回正确的 JSON 结构
- [ ] Astro 列表页能正确渲染来自 Payload 的数据
- [ ] Astro 详情页能通过 slug 正确渲染单条数据
- [ ] 草稿状态的内容不出现在前台
- [ ] `astro check` 无新增类型错误

### 7.3 整体完成标准

- [ ] 4 个 collection 全部在 Payload Admin 可用
- [ ] 前台所有列表页和详情页数据来自 Payload API
- [ ] `content.ts` 中的静态内容数组可删除，但保留类型定义和非内容数据
- [ ] `astro build` 成功，构建时能从 Payload 拉取到数据
- [ ] 首页最新文章来自 Payload 真实数据
- [ ] API 不可用时前台保持 empty state，而不是回退到示例内容

---

## 八、注意事项与常见问题

### 8.1 Payload date 字段格式

Payload 返回的 `date` 类型是 ISO 8601 格式（如 `2026-03-29T00:00:00.000Z`），前台需要截取日期部分：
```ts
publishedAt: doc.publishedAt?.split('T')[0] ?? ''
```

### 8.2 Payload array 字段结构

Payload 的 `array` 字段每个元素是一个对象，包含 `id`（Payload 自动生成）和你定义的字段。例如 `tags` array 字段每个元素是 `{ id: string, tag: string }`，需要用 `flattenArray(doc.tags, 'tag')` 展平为 `string[]`。

### 8.3 草稿过滤

Payload 开启 `versions.drafts` 后，API 默认返回所有状态的文档。前台查询必须加 `where[_status][equals]=published` 参数，否则草稿内容会出现在前台。

### 8.4 CORS 配置

如果 Astro dev server（port 4321）请求 Payload（port 3000）出现 CORS 错误，在 `apps/cms/src/payload.config.ts` 中添加：

```ts
export default buildConfig({
  cors: ['http://localhost:4321'],
  csrf: ['http://localhost:4321'],
})
```

### 8.5 Payload Admin 首次登录

首次启动 Payload 后访问 `http://localhost:3000/admin`，会引导创建第一个管理员账号。`PAYLOAD_SECRET` 环境变量必须设置为一个足够长的随机字符串（建议 32 位以上），不能使用默认的占位值。

生成方式：
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 8.6 updatedAt 字段

当前仓库实现中，`Projects` 和 `Docs` collection 显式定义了 `updatedAt` 业务字段，并由编辑端维护展示用更新时间；同时 Payload 仍会自动提供系统级 `createdAt / updatedAt` 元数据。

后续如果要统一为“只使用 Payload 自动维护的系统更新时间”，需要单独开 change 调整 schema、API 契约和前台文档，不建议在本次静态收口里顺手混改。

### 8.7 searchIndex 更新

搜索页不再依赖 `content.ts` 的静态索引，而是构建时从 4 个 collection 动态生成搜索数据。

---

## 九、OpenSpec 变更治理

本方案涉及的实现工作需要按 OpenSpec 流程执行：

```bash
npx -y @fission-ai/openspec@1.2.0 new change build-payload-content-collections
npx -y @fission-ai/openspec@1.2.0 validate build-payload-content-collections --type change --strict
npx -y @fission-ai/openspec@1.2.0 archive build-payload-content-collections -y
```

建议拆分为两个独立 change：
- `build-payload-content-collections`：只做 CMS 端的 collection 定义
- `connect-astro-to-payload-api`：只做 Astro 前台数据链路接入

---

## 十、文件变更清单汇总

### CMS 端（apps/cms）

| 操作 | 文件 |
|------|------|
| 新建 | `src/collections/Posts.ts` |
| 新建 | `src/collections/Projects.ts` |
| 新建 | `src/collections/Docs.ts` |
| 新建 | `src/collections/Notes.ts` |
| 修改 | `src/payload.config.ts`（注册4个新 collection） |

### Web 端（apps/web）

| 操作 | 文件 |
|------|------|
| 新建 | `src/lib/payload.ts`（统一 API 请求层） |
| 修改 | `src/pages/posts/index.astro` |
| 修改 | `src/pages/posts/[slug].astro` |
| 修改 | `src/pages/projects/index.astro` |
| 修改 | `src/pages/projects/[slug].astro` |
| 修改 | `src/pages/docs/index.astro` |
| 修改 | `src/pages/docs/[slug].astro` |
| 修改 | `src/pages/notes/index.astro` |
| 修改 | `src/pages/notes/[slug].astro` |
| 修改 | `src/pages/index.astro` |
| 修改 | `src/pages/search/index.astro` |

---

## 十一、当前静态收口结论

截至当前仓库状态：

- CMS 侧 4 个内容 collection 已建立并注册
- 写权限约束已显式补齐为“公开读、登录写”
- 前台主内容页面已切换到 `payload.ts` 数据链路
- 前台已移除对示例内容 fallback 的主链路依赖
- 列表页、首页 Recent Posts、搜索页已补 empty state
- 运行时启动 / API / build 验收仍需在允许的环境中完成，不应在受限或会拖死机器的环境里强行执行
