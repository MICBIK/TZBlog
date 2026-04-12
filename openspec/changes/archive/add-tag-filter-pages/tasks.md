## 前置条件

> 无。

## 1. 数据层

- [x] 1.1 payload.ts 新增 `TagInfo` 类型和 `getAllTags()` 函数
- [x] 1.2 payload.ts 新增 `TaggedContent` 类型和 `getContentByTag()` 函数

## 2. 标签聚合页

- [x] 2.1 新建 `pages/tags/index.astro`，三栏布局展示标签网格
- [x] 2.2 global.css 新增 `.tag-card` / `.tag-grid` 样式

## 3. 标签详情页

- [x] 3.1 新建 `pages/tags/[tag].astro`，按集合分组展示内容
- [x] 3.2 实现 `getStaticPaths` 生成所有标签路由

## 4. ContentCard 标签链接化

- [x] 4.1 ContentCard.astro 标签从 `<span>` 改为 `<a href="/tags/[tag]">`
- [x] 4.2 tag-list 移至 `<a class="card-link">` 外部，避免 `<a>` 嵌套无效 HTML；通过 z-index 确保可点击

## 5. 列表页 Filters 链接化

- [x] 5.1 posts/index.astro Filters 区域标签改为链接
- [x] 5.2 posts/index.astro Filters 区域添加"查看全部标签 →"入口
- [x] 5.3 projects/index.astro 移除硬编码 stage 标签，改为从项目数据动态提取 tags 链接

## 6. 验证

- [x] 6.1 `pnpm build` 构建成功（9 pages built，2026-04-12 验证通过）
- [x] 6.2 构建产物包含 `/tags/index.html`（无 CMS 数据时无 [tag] 子页面生成，符合预期）

## 7. 收尾

- [x] 7.1 提交 atomic commit
