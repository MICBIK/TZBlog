# Design: add-tag-filter-pages

## 1. 数据层：getAllTags 聚合函数

在 `apps/web/src/lib/payload.ts` 新增跨集合标签聚合：

```ts
export type TagInfo = {
  name: string
  count: number
}

export async function getAllTags(): Promise<TagInfo[]> {
  const [posts, projects, docs, notes] = await Promise.all([
    getPosts(), getProjects(), getDocs(), getNotes(),
  ])

  const tagCounts = new Map<string, number>()
  const allItems = [
    ...posts.flatMap((p) => p.tags),
    ...projects.flatMap((p) => p.tags),
    ...docs.flatMap((d) => d.tags),
    ...notes.flatMap((n) => n.tags),
  ]
  allItems.forEach((t) => tagCounts.set(t, (tagCounts.get(t) || 0) + 1))

  return [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }))
}
```

同时新增按标签获取跨集合内容的函数：

```ts
export type TaggedContent = {
  posts: PostEntry[]
  projects: ProjectEntry[]
  docs: DocEntry[]
  notes: NoteEntry[]
}

export async function getContentByTag(tag: string): Promise<TaggedContent> {
  const [posts, projects, docs, notes] = await Promise.all([
    getPosts(), getProjects(), getDocs(), getNotes(),
  ])

  return {
    posts: posts.filter((p) => p.tags.includes(tag)),
    projects: projects.filter((p) => p.tags.includes(tag)),
    docs: docs.filter((d) => d.tags.includes(tag)),
    notes: notes.filter((n) => n.tags.includes(tag)),
  }
}
```

## 2. 标签聚合页：/tags/index.astro

使用 ThreeColumnLayout 保持与其他列表页一致的三栏布局：

- **左栏**：CollectionHeader（eyebrow: "Tags", title: "标签星图"）
- **主栏**：标签网格，每个标签为一个可点击的 panel 卡片，显示标签名 + 数量
- **右栏**：说明面板

标签卡片样式复用 `.tag` 基础样式，但放大为 block 级别：

```html
<a href={`/tags/${tag.name}`} class="tag-card panel">
  <span class="tag-card-name">{tag.name}</span>
  <span class="tag-card-count">{tag.count}</span>
</a>
```

## 3. 标签详情页：/tags/[tag].astro

使用 `getStaticPaths` 生成所有标签的静态路由：

```ts
export async function getStaticPaths() {
  const tags = await getAllTags()
  return tags.map((tag) => ({
    params: { tag: tag.name },
    props: { tagName: tag.name },
  }))
}
```

页面结构：
- **左栏**：标签信息 + 返回标签列表链接
- **主栏**：按集合类型分组展示内容，每组有小标题（文章 / 项目 / 文档 / 笔记），复用 ContentCard
- **右栏**：相关标签推荐（与当前标签共现频率最高的其他标签）

## 4. ContentCard 标签链接化

将 `ContentCard.astro` 中的标签从 `<span>` 改为 `<a>`：

```diff
- <span class="tag">{tag}</span>
+ <a href={`/tags/${tag}`} class="tag" onclick="event.stopPropagation()">{tag}</a>
```

需要 `event.stopPropagation()` 防止点击标签时触发卡片整体的链接跳转。

## 5. 列表页 Filters 链接化

### posts/index.astro

```diff
- <span class="tag">{tag}</span>
+ <a href={`/tags/${tag}`} class="tag">{tag}</a>
```

### projects/index.astro

移除硬编码的 stage 标签，改为从项目数据动态提取 tags：

```ts
const projectTagCounts = new Map<string, number>()
projects.flatMap((p) => p.tags || []).forEach((t) => projectTagCounts.set(t, (projectTagCounts.get(t) || 0) + 1))
const projectTopTags = [...projectTagCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([tag]) => tag)
```

## 6. 样式

在 `global.css` 新增标签卡片样式：

```css
.tag-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  text-decoration: none;
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  transition: border-color 200ms ease, background-color 200ms ease;
}

.tag-card:hover {
  border-color: var(--border-strong);
  background: var(--glass-hover);
}

.tag-card-name {
  font-weight: 500;
}

.tag-card-count {
  color: var(--muted);
  font-size: 0.85rem;
}

.tag-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 0.75rem;
}
```

## 7. 导航入口

不在主导航中新增标签入口（保持导航简洁），但在 footer 中添加 `/tags` 链接。同时各列表页的 Filters 区域顶部添加"查看全部标签"链接。
