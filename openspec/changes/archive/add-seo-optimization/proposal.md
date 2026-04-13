## Why

当前站点缺少基础 SEO 配置：

1. 无 `sitemap.xml` — 搜索引擎无法高效发现所有页面
2. 无 `robots.txt` — 无法控制爬虫行为
3. 页面缺少 Open Graph / Twitter Card meta — 社交媒体分享时无预览卡片
4. 页面缺少 canonical URL — 可能产生重复内容问题
5. RSS feed 链接在 `socialLinks` 中指向 `/rss.xml` 但该文件不存在

## What Changes

1. 安装 `@astrojs/sitemap` 集成，自动生成 sitemap.xml
2. 创建 `apps/web/public/robots.txt`
3. 在 `SiteLayout.astro` `<head>` 添加 OG / Twitter Card meta tags
4. 在 `SiteLayout.astro` `<head>` 添加 canonical URL
5. 创建 RSS feed 端点（`/rss.xml`）

## Capabilities

### New Capabilities

- `seo-baseline`: 搜索引擎优化基础配置

## Impact

- 新增依赖 `@astrojs/sitemap`
- 修改 `apps/web/astro.config.ts` — 添加 sitemap 集成
- 新增 `apps/web/public/robots.txt`
- 修改 `apps/web/src/layouts/SiteLayout.astro` — OG / canonical / Twitter meta
- 新增 `apps/web/src/pages/rss.xml.ts` — RSS feed 端点
