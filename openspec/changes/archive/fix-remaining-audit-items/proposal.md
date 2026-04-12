## Why

审计遗留的 5 个可独立完成的项：

1. **M5** — Posts 列表页标签过滤器硬编码 "Astro"/"Payload"/"UX"，不跟随 CMS 数据
2. **M6** — ContributionGraph 的 JSON.parse 无 try-catch，畸形数据会崩溃
3. **L2** — ArticleBody、TableOfContents、projects/[slug] 内联 style 应统一为 CSS class
4. **L3** — z-index 散落使用魔数（1/30/1000/10000），应定义 CSS 变量统一管理
5. **L4** — 搜索页推荐词硬编码 "布局"/"Payload"/"搜索"，应从搜索索引动态提取

## What Changes

1. `posts/index.astro`：标签过滤器从 posts 数据中动态提取 top tags
2. `ContributionGraph.astro`：JSON.parse + cal-heatmap.paint 包裹 try-catch
3. `global.css`：新增 `.prose-list`、`.toc-link` class；内联 style 替换为 class
4. `global.css` `:root`：新增 `--z-base/--z-sticky/--z-header/--z-overlay` 变量
5. `search/index.astro`：推荐词从 searchIndex 动态提取高频关键词

## Capabilities

### Modified Capabilities

- `platform-foundation`：消除硬编码、提升容错、统一样式管理

## Impact

- 影响 6 个文件，均为 UI/容错层面
- 不影响数据流
