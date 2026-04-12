## 前置条件

> 依赖 `add-tag-filter-pages` 变更已完成。

## 1. ContentCard 视觉回归修复

- [x] 1.1 删除 scoped `.card-link { display: block }`，保留全局 flex 布局
- [x] 1.2 给 article 直接子级的 `.card-meta`（tags 区域）添加 `padding: 0 1.2rem 1.2rem`
- [x] 1.3 给 tags `.card-meta` 添加 `margin-top` 间距控制
- [x] 1.4 删除冗余的 scoped `.tag-link:hover` 规则

## 2. Astro 模板修复

- [x] 2.1 `[tag].astro` 的 `<>` / `</>` 改为 `<Fragment>` / `</Fragment>`
- [x] 2.2 `[tag].astro` 内联样式提取为 `.back-link` class

## 3. URL 安全

- [x] 3.1 tags/index.astro href 添加 `encodeURIComponent`
- [x] 3.2 tags/[tag].astro getStaticPaths params 添加 `encodeURIComponent`
- [x] 3.3 ContentCard.astro tag href 添加 `encodeURIComponent`
- [x] 3.4 posts/index.astro tag href 添加 `encodeURIComponent`
- [x] 3.5 projects/index.astro tag href 添加 `encodeURIComponent`

## 4. 数据层健壮性

- [x] 4.1 getAllTags() flatMap 添加 `|| []` 防御
- [x] 4.2 getAllTags() 过滤空白标签（`t.trim()` 守卫）
- [x] 4.3 getContentByTag() flatMap 添加 `|| []` 防御

## 5. 搜索推荐词修复

- [x] 5.1 search/index.astro 改为从全部集合的 tags 提取推荐词

## 6. 列表页一致性

- [x] 6.1 docs/index.astro 添加 tag filter 区域
- [x] 6.2 notes/index.astro 添加 tag filter 区域
- [x] 6.3 统一 eyebrow 命名为 "Tags"
- [x] 6.4 topTags 为空时条件渲染（不显示空 panel）

## 7. CSS 清理

- [x] 7.1 合并 global.css 重复的 `.tag` 定义
- [x] 7.2 `.section-label` 从 [tag].astro scoped 移到 global.css
- [x] 7.3 global.css 新增 `.back-link` 工具类

## 8. 验证

- [x] 8.1 `pnpm build` 构建成功

## 9. 收尾

- [x] 9.1 提交 atomic commit
