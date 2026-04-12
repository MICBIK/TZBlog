# Design: fix-data-layer-robustness

## 1. payload.ts 类型安全

定义 Payload API 响应的具体类型替代 `Record<string, any>`：

```ts
interface PayloadPostDoc {
  slug: string
  title: string
  summary: string
  category: string
  orbit: string
  publishedAt: string
  readTime: string
  featured?: boolean
  tags?: PayloadTextItem[]
  sections?: PayloadSection[]
}
```

类似地为 Project/Doc/Note 定义。normalizer 函数签名从 `(doc: Record<string, any>)` 改为 `(doc: PayloadPostDoc)` 等。

## 2. PinnedRepo 类型去重

`github.ts` 删除 `interface PinnedRepo`，改为 `import type { PinnedRepo } from '../data/content'`。

## 3. getReposStats 改用 Promise.allSettled

```ts
export async function getReposStats(repos: PinnedRepo[]): Promise<RepoStats[]> {
  const results = await Promise.allSettled(repos.map((r) => getRepoStats(r.owner, r.repo)))
  return results.map((result, i) =>
    result.status === 'fulfilled' ? result.value : createRepoFallback(repos[i].owner, repos[i].repo)
  )
}
```

## 4. 清理死代码

- 删除 `content.ts` 的 `mainContentNavItems`
- 删除 `content-fallback.ts`

## 5. ProjectCard stars 默认值

```ts
const { name, description, stars = 0, language, url } = Astro.props
```

## 6. umami.ts epoch 注释

```ts
start: 1672531200000, // 2023-01-01T00:00:00Z — 建站时间
```
