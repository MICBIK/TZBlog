## 前置条件

> 无。

## 1. 动态标签

- [x] 1.1 posts/index.astro 标签过滤器已从 posts 数据动态提取（此前迭代已完成，本轮补充 tags undefined 防御）

## 2. ContributionGraph 容错

- [x] 2.1 JSON.parse + cal-heatmap.paint 已包裹 try-catch（此前迭代已完成）

## 3. 内联样式提取

- [x] 3.1 global.css 已有 .prose-list / .toc-link / .highlights-list / .link-muted（此前迭代已完成）
- [x] 3.2 ArticleBody.astro 已替换内联 style（此前迭代已完成）
- [x] 3.3 TableOfContents.astro 已替换内联 style（此前迭代已完成）
- [x] 3.4 projects/[slug].astro 已替换内联 style（此前迭代已完成）

## 4. z-index 变量

- [x] 4.1 :root 已有 z-index CSS 变量（此前迭代已完成）
- [x] 4.2 已替换所有 z-index 魔数（本轮补充 ContentCard.astro `z-index: 1` → `var(--z-base)`）

## 5. 搜索推荐词

- [x] 5.1 search/index.astro 推荐词已改为从 posts 数据动态提取高频关键词（本轮完成）

## 6. 验证

- [x] 6.1 `pnpm build` 构建成功（2026-04-12 验证通过）

## 7. 收尾

- [x] 7.1 代码已在历史 commit d34d5f1 中提交（2026-04-12 确认）
