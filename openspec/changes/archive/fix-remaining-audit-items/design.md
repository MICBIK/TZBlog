# Design: fix-remaining-audit-items

## 1. 动态标签过滤器

从 posts 数据中提取所有 tags，统计频率，取 top 5：

```ts
const allTags = posts.flatMap((p) => p.tags)
const tagCounts = new Map<string, number>()
allTags.forEach((t) => tagCounts.set(t, (tagCounts.get(t) || 0) + 1))
const topTags = [...tagCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([tag]) => tag)
```

## 2. ContributionGraph try-catch

整个 `heatmapRoots.forEach` 回调内容包裹 try-catch。

## 3. 内联样式提取

新增 CSS class：
```css
.prose-list { padding-left: 1.5rem; display: grid; gap: 0.5rem; }
.toc-link { opacity: 0.8; }
.highlights-list { padding-left: 1.2rem; display: grid; gap: 0.5rem; }
.link-muted { opacity: 0.8; }
```

## 4. z-index CSS 变量

```css
:root {
  --z-base: 1;
  --z-sticky: 30;
  --z-header: 1000;
  --z-overlay: 10000;
}
```

## 5. 动态搜索推荐词

从 searchIndex 的 title 中提取高频词（取 top 3 个 2+ 字符的词）。
