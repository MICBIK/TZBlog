# Design: connect-astro-to-payload-api

> 详细代码实现见：`docs/TZBlog CMS数据链路实现方案.md` 第四、五、六章

## 1. 文件变更清单

```
apps/web/src/
  lib/
    payload.ts          # 新建：统一 Payload API 请求层
  pages/
    index.astro         # 修改：首页数据来源
    posts/
      index.astro       # 修改：列表页数据来源
      [slug].astro      # 修改：详情页数据来源
    projects/
      index.astro       # 修改
      [slug].astro      # 修改
    docs/
      index.astro       # 修改
      [slug].astro      # 修改
    notes/
      index.astro       # 修改
      [slug].astro      # 修改
    search/
      index.astro       # 修改：searchIndex 动态生成
  .env                  # 修改：添加 PAYLOAD_API_URL
```

## 2. payload.ts 核心设计

### 2.1 基础请求函数（含降级）

```ts
const API_URL = import.meta.env.PAYLOAD_API_URL || 'http://localhost:3000/api'

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

### 2.2 数据转换说明

Payload array 字段返回 `{ id: string, <fieldName>: string }[]`，需要展平：

```ts
// tags: [{ id: '...', tag: 'Astro' }] → ['Astro']
const flattenArray = (arr, key) => (arr || []).map(item => item[key])

// paragraphs: [{ id: '...', text: '...' }] → ['...']
// bullets 同理

// sections 需要递归展平 paragraphs 和 bullets
const flattenSections = (sections) => sections.map(s => ({
  id: s.id,
  title: s.title,
  paragraphs: flattenArray(s.paragraphs, 'text'),
  bullets: s.bullets ? flattenArray(s.bullets, 'text') : undefined,
}))
```

### 2.3 日期字段处理

Payload date 字段返回 ISO 8601 格式（`2026-03-29T00:00:00.000Z`），截取日期部分：
```ts
publishedAt: doc.publishedAt?.split('T')[0] ?? ''
```

### 2.4 草稿过滤

所有查询必须带 `where[_status][equals]=published`，否则草稿会出现在前台。

### 2.5 导出函数列表

| 函数 | 用途 |
|------|------|
| `getPosts()` | 获取所有已发布文章，按 publishedAt 降序 |
| `getPostBySlug(slug)` | 按 slug 获取单篇文章 |
| `getProjects()` | 获取所有已发布项目，按 updatedAt 降序 |
| `getProjectBySlug(slug)` | 按 slug 获取单个项目 |
| `getDocs()` | 获取所有已发布文档 |
| `getDocBySlug(slug)` | 按 slug 获取单个文档 |
| `getNotes()` | 获取所有已发布笔记，按 publishedAt 降序 |
| `getNoteBySlug(slug)` | 按 slug 获取单条笔记 |

## 3. 页面改造模式

### 列表页（统一模式）

```astro
---
// 改前：import { posts } from '../../data/content'
// 改后：
import { getPosts } from '../../lib/payload'
const posts = await getPosts()
// 后续模板代码不需要修改
---
```

### 详情页（统一模式）

```astro
---
// 改前：
// import { posts } from '../../data/content'
// export async function getStaticPaths() {
//   return posts.map(p => ({ params: { slug: p.slug } }))
// }
// const post = posts.find(p => p.slug === slug)

// 改后：
import { getPosts, getPostBySlug } from '../../lib/payload'
export async function getStaticPaths() {
  const posts = await getPosts()
  return posts.map(p => ({ params: { slug: p.slug } }))
}
const { slug } = Astro.params
const post = await getPostBySlug(slug)
if (!post) return Astro.redirect('/404')
// 后续模板代码不需要修改
---
```

### 首页

```astro
---
import { getPosts, getProjects } from '../lib/payload'
const allPosts = await getPosts()
const recentPosts = allPosts.slice(0, 3)
const featuredProjects = (await getProjects()).filter(p => p.featured)
---
```

### 搜索页

```astro
---
import { getPosts, getProjects, getDocs, getNotes } from '../../lib/payload'
const [posts, projects, docs, notes] = await Promise.all([
  getPosts(), getProjects(), getDocs(), getNotes()
])
const searchIndex = [
  ...posts.map(i => ({ type: '文章', title: i.title, summary: i.summary, href: `/posts/${i.slug}`, meta: `${i.publishedAt} · ${i.readTime}` })),
  ...projects.map(i => ({ type: '项目', title: i.title, summary: i.summary, href: `/projects/${i.slug}`, meta: `${i.stage} · ${i.updatedAt}` })),
  ...docs.map(i => ({ type: '文档', title: i.title, summary: i.summary, href: `/docs/${i.slug}`, meta: `${i.version} · ${i.updatedAt}` })),
  ...notes.map(i => ({ type: '笔记', title: i.title, summary: i.summary, href: `/notes/${i.slug}`, meta: `${i.mood} · ${i.publishedAt}` })),
]
const initialResults = searchIndex.slice(0, 6)
---
```

## 4. 环境变量

`apps/web/.env` 添加：
```env
PAYLOAD_API_URL=http://localhost:3000/api
```

`apps/web/.env.example` 同步添加（不含真实值）。

## 5. 类型来源

`payload.ts` 中使用的 `PostEntry / ProjectEntry / DocEntry / NoteEntry / SectionBlock` 类型从 `../data/content` 导入，不重复定义。`content.ts` 中的类型定义在完成迁移后继续保留，静态内容数组（posts/projects/docsCollection/notes）可删除。
