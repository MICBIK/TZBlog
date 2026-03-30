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
3. 保持前台页面结构、路由、组件完全不变，只替换数据来源

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
- 所有 collection 的 read access 设为公开（`() => true`），write 需要登录
- `tags` / `stack` / `highlights` 使用 `array` of `text` 实现

### 3.2 Posts Collection

文件路径：`apps/cms/src/collections/Posts.ts`

```ts
import type { CollectionConfig } from 'payload'

export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'publishedAt', '_status'],
  },
  access: {
    read: () => true,
  },
  versions: {
    drafts: true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: { description: 'URL 标识符，只能包含小写字母、数字和连字符' },
    },
    {
      name: 'summary',
      type: 'textarea',
      required: true,
    },
    {
      name: 'category',
      type: 'text',
      required: true,
    },
    {
      name: 'orbit',
      type: 'text',
      required: true,
      admin: { description: '副标题/轨道标签，如 Deep Space Observatory' },
    },
    {
      name: 'publishedAt',
      type: 'date',
      required: true,
      admin: { date: { pickerAppearance: 'dayOnly' } },
    },
    {
      name: 'readTime',
      type: 'text',
      required: true,
      admin: { description: '如：8 min' },
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'tags',
      type: 'array',
      fields: [
        { name: 'tag', type: 'text', required: true },
      ],
    },
    {
      name: 'sections',
      type: 'array',
      required: true,
      fields: [
        { name: 'id', type: 'text', required: true },
        { name: 'title', type: 'text', required: true },
        {
          name: 'paragraphs',
          type: 'array',
          required: true,
          fields: [{ name: 'text', type: 'textarea', required: true }],
        },
        {
          name: 'bullets',
          type: 'array',
          fields: [{ name: 'text', type: 'text', required: true }],
        },
      ],
    },
  ],
}
```

### 3.3 Projects Collection

文件路径：`apps/cms/src/collections/Projects.ts`

```ts
import type { CollectionConfig } from 'payload'

export const Projects: CollectionConfig = {
  slug: 'projects',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'stage', 'updatedAt', '_status'],
  },
  access: {
    read: () => true,
  },
  versions: {
    drafts: true,
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true },
    { name: 'summary', type: 'textarea', required: true },
    {
      name: 'stage',
      type: 'select',
      required: true,
      options: [
        { label: 'In Progress', value: 'In Progress' },
        { label: 'Planned', value: 'Planned' },
        { label: 'Concept', value: 'Concept' },
        { label: 'Stable', value: 'Stable' },
        { label: 'Archived', value: 'Archived' },
      ],
    },
    {
      name: 'orbit',
      type: 'text',
      required: true,
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'stack',
      type: 'array',
      fields: [{ name: 'item', type: 'text', required: true }],
    },
    {
      name: 'tags',
      type: 'array',
      fields: [{ name: 'tag', type: 'text', required: true }],
    },
    {
      name: 'links',
      type: 'array',
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'href', type: 'text', required: true },
      ],
    },
    {
      name: 'highlights',
      type: 'array',
      fields: [{ name: 'text', type: 'text', required: true }],
    },
    {
      name: 'sections',
      type: 'array',
      required: true,
      fields: [
        { name: 'id', type: 'text', required: true },
        { name: 'title', type: 'text', required: true },
        {
          name: 'paragraphs',
          type: 'array',
          required: true,
          fields: [{ name: 'text', type: 'textarea', required: true }],
        },
        {
          name: 'bullets',
          type: 'array',
          fields: [{ name: 'text', type: 'text', required: true }],
        },
      ],
    },
  ],
}
```

### 3.4 Docs Collection

文件路径：`apps/cms/src/collections/Docs.ts`

```ts
import type { CollectionConfig } from 'payload'

export const Docs: CollectionConfig = {
  slug: 'docs',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'version', 'updatedAt', '_status'],
  },
完整代码如下：
  access: {
    read: () => true,
  },
  versions: {
    drafts: true,
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true },
    { name: 'summary', type: 'textarea', required: true },
    { name: 'version', type: 'text', required: true, admin: { description: '如：v0.2 / draft' } },
    { name: 'orbit', type: 'text', required: true },
    {
      name: 'tags',
      type: 'array',
      fields: [{ name: 'tag', type: 'text', required: true }],
    },
    {
      name: 'sections',
      type: 'array',
      required: true,
      fields: [
        { name: 'id', type: 'text', required: true },
        { name: 'title', type: 'text', required: true },
        {
          name: 'paragraphs',
          type: 'array',
          required: true,
          fields: [{ name: 'text', type: 'textarea', required: true }],
        },
        {
          name: 'bullets',
          type: 'array',
          fields: [{ name: 'text', type: 'text', required: true }],
        },
      ],
    },
  ],
}
```

### 3.5 Notes Collection

文件路径：`apps/cms/src/collections/Notes.ts`

```ts
import type { CollectionConfig } from 'payload'

export const Notes: CollectionConfig = {
  slug: 'notes',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'mood', 'publishedAt', '_status'],
  },
  access: {
    read: () => true,
  },
  versions: {
    drafts: true,
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true },
    { name: 'summary', type: 'textarea', required: true },
    {
      name: 'publishedAt',
      type: 'date',
      required: true,
      admin: { date: { pickerAppearance: 'dayOnly' } },
    },
    { name: 'mood', type: 'text', required: true, admin: { description: '如：Ship Log / Short Note / Field Memo' } },
    {
      name: 'tags',
      type: 'array',
      fields: [{ name: 'tag', type: 'text', required: true }],
    },
    {
      name: 'sections',
      type: 'array',
      required: true,
      fields: [
        { name: 'id', type: 'text', required: true },
        { name: 'title', type: 'text', required: true },
        {
          name: 'paragraphs',
          type: 'array',
          required: true,
          fields: [{ name: 'text', type: 'textarea', required: true }],
        },
        {
          name: 'bullets',
          type: 'array',
          fields: [{ name: 'text', type: 'text', required: true }],
        },
      ],
    },
  ],
}
```

### 3.6 注册到 payload.config.ts

```ts
// apps/cms/src/payload.config.ts
import { Posts } from './collections/Posts'
import { Projects } from './collections/Projects'
import { Docs } from './collections/Docs'
import { Notes } from './collections/Notes'
import { Users } from './collections/Users'
import { Media } from './collections/Media'

export default buildConfig({
  // ...现有配置保持不变...
  collections: [Users, Media, Posts, Projects, Docs, Notes],
})
```

---

## 四、Astro 前台数据链路设计

### 4.1 总体策略

Astro 是静态构建框架，数据在构建时（build time）从 Payload REST API 拉取，生成静态 HTML。不使用客户端实时请求。

发布流程：
```
编辑内容 → Payload 写入 PostgreSQL → 触发 Webhook → Astro rebuild → 生成静态页面
```

### 4.2 环境变量

在 `apps/web/.env` 中添加：

```env
# Payload CMS API 地址
PAYLOAD_API_URL=http://localhost:3000/api

# 可选：如果 Payload 需要 API Key 才能读取（当前 read 是公开的，可不填）
# PAYLOAD_API_KEY=your-api-key
```

### 4.3 创建统一的 API 请求层

文件路径：`apps/web/src/lib/payload.ts`

这个文件负责所有与 Payload REST API 的通信，前台页面只从这里取数据。

```ts
// apps/web/src/lib/payload.ts

const API_URL = import.meta.env.PAYLOAD_API_URL || 'http://localhost:3000/api'

// ---- 通用请求函数 ----
async function fetchPayload<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`)
  if (!res.ok) throw new Error(`Payload API error: ${res.status} ${path}`)
  return res.json()
}

// ---- 数据转换工具 ----
// Payload array 字段返回的是 { tag: string }[] 格式，需要展平
const flattenArray = (arr: { [key: string]: string }[] | undefined, key: string): string[] =>
  (arr || []).map((item) => item[key])

const flattenSections = (sections: any[]): SectionBlock[] =>
  (sections || []).map((s) => ({
    id: s.id,
    title: s.title,
    paragraphs: flattenArray(s.paragraphs, 'text'),
    bullets: s.bullets ? flattenArray(s.bullets, 'text') : undefined,
  }))

// ---- Posts ----
export async function getPosts(): Promise<PostEntry[]> {
  const data = await fetchPayload<{ docs: any[] }>('/posts?limit=100&sort=-publishedAt&where[_status][equals]=published')
  return data.docs.map((doc) => ({
    slug: doc.slug,
    title: doc.title,
    summary: doc.summary,
    category: doc.category,
    orbit: doc.orbit,
    publishedAt: doc.publishedAt?.split('T')[0] ?? '',
    readTime: doc.readTime,
    featured: doc.featured ?? false,
    tags: flattenArray(doc.tags, 'tag'),
    sections: flattenSections(doc.sections),
  }))
}

export async function getPostBySlug(slug: string): Promise<PostEntry | null> {
  const data = await fetchPayload<{ docs: any[] }>(`/posts?where[slug][equals]=${slug}&where[_status][equals]=published`)
  if (!data.docs.length) return null
  const doc = data.docs[0]
  return {
    slug: doc.slug,
    title: doc.title,
    summary: doc.summary,
    category: doc.category,
    orbit: doc.orbit,
    publishedAt: doc.publishedAt?.split('T')[0] ?? '',
    readTime: doc.readTime,
    featured: doc.featured ?? false,
    tags: flattenArray(doc.tags, 'tag'),
    sections: flattenSections(doc.sections),
  }
}

// ---- Projects ----
export async function getProjects(): Promise<ProjectEntry[]> {
  const data = await fetchPayload<{ docs: any[] }>('/projects?limit=100&sort=-updatedAt&where[_status][equals]=published')
  return data.docs.map((doc) => ({
    slug: doc.slug,
    title: doc.title,
    summary: doc.summary,
    stage: doc.stage,
    orbit: doc.orbit,
    updatedAt: doc.updatedAt?.split('T')[0] ?? '',
    featured: doc.featured ?? false,
    stack: flattenArray(doc.stack, 'item'),
    tags: flattenArray(doc.tags, 'tag'),
    links: (doc.links || []).map((l: any) => ({ label: l.label, href: l.href })),
    highlights: flattenArray(doc.highlights, 'text'),
    sections: flattenSections(doc.sections),
  }))
}

export async function getProjectBySlug(slug: string): Promise<ProjectEntry | null> {
  const data = await fetchPayload<{ docs: any[] }>(`/projects?where[slug][equals]=${slug}&where[_status][equals]=published`)
  if (!data.docs.length) return null
  const doc = data.docs[0]
  return {
    slug: doc.slug,
    title: doc.title,
    summary: doc.summary,
    stage: doc.stage,
    orbit: doc.orbit,
    updatedAt: doc.updatedAt?.split('T')[0] ?? '',
    featured: doc.featured ?? false,
    stack: flattenArray(doc.stack, 'item'),
    tags: flattenArray(doc.tags, 'tag'),
    links: (doc.links || []).map((l: any) => ({ label: l.label, href: l.href })),
    highlights: flattenArray(doc.highlights, 'text'),
    sections: flattenSections(doc.sections),
  }
}

// ---- Docs ----
export async function getDocs(): Promise<DocEntry[]> {
  const data = await fetchPayload<{ docs: any[] }>('/docs?limit=100&sort=-updatedAt&where[_status][equals]=published')
  return data.docs.map((doc) => ({
    slug: doc.slug,
    title: doc.title,
    summary: doc.summary,
    version: doc.version,
    orbit: doc.orbit,
    updatedAt: doc.updatedAt?.split('T')[0] ?? '',
    tags: flattenArray(doc.tags, 'tag'),
    sections: flattenSections(doc.sections),
  }))
}

export async function getDocBySlug(slug: string): Promise<DocEntry | null> {
  const data = await fetchPayload<{ docs: any[] }>(`/docs?where[slug][equals]=${slug}&where[_status][equals]=published`)
  if (!data.docs.length) return null
  const doc = data.docs[0]
  return {
    slug: doc.slug,
    title: doc.title,
    summary: doc.summary,
    version: doc.version,
    orbit: doc.orbit,
    updatedAt: doc.updatedAt?.split('T')[0] ?? '',
    tags: flattenArray(doc.tags, 'tag'),
    sections: flattenSections(doc.sections),
  }
}

// ---- Notes ----
export async function getNotes(): Promise<NoteEntry[]> {
  const data = await fetchPayload<{ docs: any[] }>('/notes?limit=100&sort=-publishedAt&where[_status][equals]=published')
  return data.docs.map((doc) => ({
    slug: doc.slug,
    title: doc.title,
    summary: doc.summary,
    publishedAt: doc.publishedAt?.split('T')[0] ?? '',
    mood: doc.mood,
    tags: flattenArray(doc.tags, 'tag'),
    sections: flattenSections(doc.sections),
  }))
}

export async function getNoteBySlug(slug: string): Promise<NoteEntry | null> {
  const data = await fetchPayload<{ docs: any[] }>(`/notes?where[slug][equals]=${slug}&where[_status][equals]=published`)
  if (!data.docs.length) return null
  const doc = data.docs[0]
  return {
    slug: doc.slug,
    title: doc.title,
    summary: doc.summary,
    publishedAt: doc.publishedAt?.split('T')[0] ?? '',
    mood: doc.mood,
    tags: flattenArray(doc.tags, 'tag'),
    sections: flattenSections(doc.sections),
  }
}
```

> **注意**：上面的类型 `PostEntry / ProjectEntry / DocEntry / NoteEntry / SectionBlock` 直接从 `content.ts` 导入，无需重新定义。


---

## 五、前台页面改造

### 5.1 改造原则

- **只改数据来源，不改页面结构**：所有 `.astro` 页面的 HTML 结构、组件调用、CSS class 全部保持不变
- **逐步替换**：建议按 posts → projects → docs → notes 顺序依次替换，每替换一个验证一次
- **保留 content.ts**：`navItems / siteMeta / socialLinks / pinnedRepos` 等非内容数据继续从 `content.ts` 读取，不需要迁移到 Payload

### 5.2 列表页改造示例（以 posts/index.astro 为例）

**改造前**：
```astro
---
import { posts } from '../../data/content'
// posts 是 content.ts 里的静态数组
---
```

**改造后**：
```astro
---
import { getPosts } from '../../lib/payload'
const posts = await getPosts()
// 数据结构完全一致，后续模板代码不需要修改
---
```

### 5.3 详情页改造示例（以 posts/[slug].astro 为例）

**改造前**：
```astro
---
import { posts } from '../../data/content'
export async function getStaticPaths() {
  return posts.map((post) => ({ params: { slug: post.slug } }))
}
const { slug } = Astro.params
const post = posts.find((p) => p.slug === slug)
---
```

**改造后**：
```astro
---
import { getPosts, getPostBySlug } from '../../lib/payload'
export async function getStaticPaths() {
  const posts = await getPosts()
  return posts.map((post) => ({ params: { slug: post.slug } }))
}
const { slug } = Astro.params
const post = await getPostBySlug(slug)
if (!post) return Astro.redirect('/404')
---
```

### 5.4 需要改造的文件清单

| 文件 | 改动类型 | 涉及函数 |
|------|---------|----------|
| `src/pages/posts/index.astro` | 数据来源替换 | `getPosts()` |
| `src/pages/posts/[slug].astro` | 数据来源替换 | `getPosts()` + `getPostBySlug()` |
| `src/pages/projects/index.astro` | 数据来源替换 | `getProjects()` |
| `src/pages/projects/[slug].astro` | 数据来源替换 | `getProjects()` + `getProjectBySlug()` |
| `src/pages/docs/index.astro` | 数据来源替换 | `getDocs()` |
| `src/pages/docs/[slug].astro` | 数据来源替换 | `getDocs()` + `getDocBySlug()` |
| `src/pages/notes/index.astro` | 数据来源替换 | `getNotes()` |
| `src/pages/notes/[slug].astro` | 数据来源替换 | `getNotes()` + `getNoteBySlug()` |
| `src/pages/index.astro` | 部分替换 | `getPosts()` 取最新3篇，`getProjects()` 取 featured |

### 5.5 首页改造说明

首页 `index.astro` 中引用了 `posts`（取前3篇）和项目卡片数据，改造方式：

```astro
---
import { getPosts, getProjects } from '../lib/payload'
const allPosts = await getPosts()
const recentPosts = allPosts.slice(0, 3)
const featuredProjects = (await getProjects()).filter(p => p.featured)
---
```

---

## 六、错误处理与降级策略

### 6.1 构建时 API 不可用

Payload CMS 必须在 Astro 构建前启动。如果构建时 Payload 不可用，`fetchPayload` 会抛出异常导致构建失败。

建议在 `payload.ts` 中加入降级逻辑：

```ts
async function fetchPayload<T>(path: string): Promise<T> {
  try {
    const res = await fetch(`${API_URL}${path}`)
    if (!res.ok) throw new Error(`${res.status}`)
    return res.json()
  } catch (err) {
    console.warn(`[payload] API unavailable: ${path}`, err)
    return { docs: [] } as T  // 返回空数组，页面正常构建但无内容
  }
}
```

### 6.2 详情页 slug 不存在

`getPostBySlug` 返回 `null` 时，页面执行 `Astro.redirect('/404')` 或渲染 404 状态。

---

## 七、执行顺序与验证标准

### 7.1 推荐执行顺序

```
Step 1: 启动 PostgreSQL（docker compose up -d postgres）
Step 2: 启动 Payload CMS（cd apps/cms && pnpm dev）
Step 3: 首次访问 http://localhost:3000/admin，创建管理员账号
Step 4: 实现 Posts collection（创建文件 + 注册到 payload.config.ts）
Step 5: 在 Payload Admin 创建 1~2 条 Post 测试数据并发布
Step 6: 验证 REST API：GET http://localhost:3000/api/posts
Step 7: 创建 apps/web/src/lib/payload.ts
Step 8: 改造 posts/index.astro 和 posts/[slug].astro
Step 9: 启动 Astro（cd apps/web && pnpm dev），验证文章列表页和详情页正常显示
Step 10: 重复 Step 4~9，依次完成 projects / docs / notes
Step 11: 改造首页数据来源
Step 12: 运行 astro check + astro build，确认 0 errors
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
- [ ] `content.ts` 中的 `posts / projects / docsCollection / notes` 静态数据可以删除（但保留类型定义和非内容数据）
- [ ] `astro build` 成功，构建时能从 Payload 拉取到数据
- [ ] 首页最新文章和精选项目来自 Payload 真实数据


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
  // ...现有配置...
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

Payload 会自动为每个 collection 生成 `updatedAt` 和 `createdAt` 字段，不需要在 collection 定义中手动添加。Projects 和 Docs 使用 `updatedAt` 时直接从 Payload 自动字段读取即可。

### 8.7 searchIndex 更新

`content.ts` 中的 `searchIndex` 当前由静态数据生成。接入 Payload 后，需要在构建时动态生成：

```ts
// 在 search/index.astro 的 frontmatter 中
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
```

---

## 九、OpenSpec 变更治理

本方案涉及的实现工作需要按 OpenSpec 流程执行：

```bash
# 创建新 change
npx -y @fission-ai/openspec@1.2.0 new change build-payload-content-collections

# 撰写 proposal / specs / design / tasks 后验证
npx -y @fission-ai/openspec@1.2.0 validate build-payload-content-collections --type change --strict

# 实现完成后归档
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
| 修改 | `src/pages/index.astro`（首页数据来源） |
| 修改 | `src/pages/search/index.astro`（searchIndex 动态生成） |
| 修改 | `.env`（添加 PAYLOAD_API_URL） |
| 可选删除 | `src/data/content.ts` 中的静态内容数组（保留类型定义） |

---

*执行前请确认 PostgreSQL 已启动，Payload CMS 环境变量已正确配置。*
