# Design: fix-homepage-data-fetch-waterfall

## 1. 文件变更清单

```
apps/web/src/
  lib/
    github.ts          # 修改：getReposStats 改为 Promise.all 并发
  pages/
    index.astro        # 修改：frontmatter 数据获取改为 Promise.all 并行
```

## 2. github.ts — getReposStats 改造

### 现状（串行 + 人为延迟）

```ts
export async function getReposStats(repos: PinnedRepo[]): Promise<RepoStats[]> {
  const results: RepoStats[] = []
  for (const repoEntry of repos) {
    results.push(await getRepoStats(repoEntry.owner, repoEntry.repo))
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  return results
}
```

### 改为（并行）

```ts
export async function getReposStats(repos: PinnedRepo[]): Promise<RepoStats[]> {
  return Promise.all(
    repos.map((r) => getRepoStats(r.owner, r.repo))
  )
}
```

- 去除 100ms sleep：3 个认证请求不会触发 GitHub 5000 次/小时的速率限制
- 返回顺序由 `Promise.all` 保证与输入顺序一致

## 3. index.astro — frontmatter 并行化

### 现状（串行瀑布流）

```ts
const contributionCalendar = await getContributionCalendar(username)
const repoStats = await getReposStats(pinnedRepos)
const allPosts = await getPosts()
// ...
const [todayStats, allTimeStats] = await Promise.all([...umami])
```

### 改为（全并行）

```ts
const [contributionCalendar, repoStats, allPosts, [todayStats, allTimeStats]] =
  await Promise.all([
    getContributionCalendar(username),
    getReposStats(pinnedRepos),
    getPosts(),
    Promise.all([
      getUmamiStats(import.meta.env.UMAMI_WEBSITE_ID || '', todayRange.start, todayRange.end),
      getUmamiStats(import.meta.env.UMAMI_WEBSITE_ID || '', allTimeRange.start, allTimeRange.end),
    ]),
  ])
```

注意：`todayRange` / `allTimeRange` 是纯同步计算，需在 `Promise.all` 之前完成，无依赖问题。

## 4. 性能预期

| 场景 | 改前耗时（估算） | 改后耗时（估算） |
|------|------------------|------------------|
| 所有 API 正常 | 1.4-2.9s | 0.3-0.8s |
| GitHub 慢（800ms） | 2.2-3.5s | 0.8s |
| Payload 不可用 | 1.2-2.6s + timeout | 最慢的单个 timeout |
