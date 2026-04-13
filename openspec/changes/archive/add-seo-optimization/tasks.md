## 1. 基线与准备

- [x] 1.1 确认当前 `astro.config.ts` 的 `site` 字段是否已配置
- [x] 1.2 确认当前 `SiteLayout.astro` `<head>` 已有的 meta 标签

## 2. Sitemap

- [x] 2.1 安装 `@astrojs/sitemap`
- [x] 2.2 在 `astro.config.ts` 添加 sitemap 集成配置
- [x] 2.3 配置 `site` URL（从环境变量 `SITE_URL` 读取）

## 3. Robots.txt

- [x] 3.1 创建 `apps/web/public/robots.txt`（Allow all + Sitemap 指向）

## 4. Open Graph / Twitter Card

- [x] 4.1 在 `SiteLayout.astro` props 增加 `image` / `type` 可选参数
- [x] 4.2 在 `<head>` 添加 `og:title` / `og:description` / `og:image` / `og:url` / `og:type`
- [x] 4.3 在 `<head>` 添加 `twitter:card` / `twitter:title` / `twitter:description`
- [x] 4.4 添加 `<link rel="canonical">` 标签

## 5. RSS Feed

- [x] 5.1 创建 `apps/web/src/pages/rss.xml.ts` — 使用 `@astrojs/rss` 生成 feed
- [x] 5.2 Feed 内容包含最新 20 篇已发布文章

## 6. 验证

- [x] 6.1 `astro build` 输出包含 `sitemap-index.xml`
- [x] 6.2 `robots.txt` 可访问且内容正确
- [x] 6.3 页面 HTML 包含 OG / Twitter meta
- [x] 6.4 `/rss.xml` 返回有效的 RSS 2.0 XML
