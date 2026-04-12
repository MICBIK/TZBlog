## Why

所有页面缺失 `og:image` 和 `twitter:image` meta 标签，社交分享时无缩略图预览。同时缺失 favicon 和 apple-touch-icon，浏览器标签页无图标。

## What Changes

1. `BaseLayout.astro`：添加 `og:image`、`twitter:image` meta 标签（支持 props 覆盖，默认使用站点级 OG 图）
2. `BaseLayout.astro`：添加 favicon link 标签

## Capabilities

### Modified Capabilities

- `platform-foundation`：SEO meta 从基础文本升级为支持社交卡片预览

## Impact

- 仅影响 `apps/web/src/layouts/BaseLayout.astro`
- 需要准备默认 OG 图片文件（`public/og-default.png`）和 favicon 文件
