# Design: add-seo-meta-tags

## BaseLayout.astro 改动

### 新增 Props

```ts
interface Props {
  title: string
  description?: string
  ogImage?: string  // 新增：自定义 OG 图片 URL
}
```

### 新增 meta 标签

```html
<meta property="og:image" content={ogImageUrl} />
<meta name="twitter:image" content={ogImageUrl} />
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
```

默认 `ogImage` 为 `/og-default.png`。

### 默认 OG 图片

创建简单的 `public/favicon.svg`（站点图标）。OG 图片暂用占位，后续替换。
