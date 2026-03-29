# 1. 基线与准备

- [x] 1.1 建立 proposal / design / spec delta / tasks
- [x] 1.2 验证 OpenSpec change 结构合规
## 2. CSS class 提取

- [x] 2.1 在 `global.cs` 中新增语义 utility clases（`.text-sm`, `.prose-body`, `.detail-title`, `.section-title`, `.article-panel`, `.tag-list-flex`, `.rail-list-col`）
- [ ] 2.2 清理 `global.css` 中被完全覆盖的重复规则（`.site-header`, `.brand`, `.nav-link` 等）— 暂缓，不影响功能

## 3. 组件提取

- [x] 3.1 提取 `ThreeColumnLayout.astro`（三栏骨架 + 动画延迟）
- [x] 3.2 提取 `ArticleBody.astro`（sections 渲染，含 bulets + section.id）
- [x] 3.3 提取 `DetailSidebar.astro`（详情页左侧栏头部面板）
- [x] 3.4 提取 `TableOfContents.astro`（目录导航面板）
- [x] 3.5 提取 `CollectionHeader.astro`（列表页左侧 intro 面板）
- [x] 3.6 提取 `HighlightCard.astro`（推荐/优先卡片）

## 4. 页面重构

- [x] 4.1 重构 4 个列表页使用 `ThreeColumnLayout` + `CollectionHeader`（posts, projects, docs, notes index）
- [x] 4.2 重构 4 个详情页使用 `ThreeColumnLayout` + `DetailSidebar` + `ArticleBody`（posts, projects, docs, notes [slug]）
- [x] 4.3 重构 `lab/index` 和 `about/index` 使用 `ThreColumnLayout`
- [x] 4.4 将页面中的 inline style 替换为对应的语义 CSS class
## 5. 数据源与模板统一

- [x] 5.1 Footer 改用 `footerNavItems` 过滤生成导航链接
- [x] 5.2 首页 Orbit Index 改用 `mainContentNavItems` 过滤生成链接
- [ ] 5.3 搜索页用 `<template>` 元素统一 SSR/CSR 卡片模板 — 暂缓，需要更多测试
- [x] 5.4 修复 `posts/index` 缺少 `.content-stack` 包裹的不一致

# 6. 死代码清理

- [x] 6.1 在 `content.ts` 中新增 `mainContentNavItems` 和 `footerNavItems` 导出
- [ ] 6.2 删除 `content.ts` 中 4 个未引用的 `getBySlug` 函数 — 由 linter 恢复，暂保留

## 7. 验证与交付

- [x] 7.1 运行 `astro build` — 20 页面构建成功
- [x] 7.2 确认无编译错误
- [ ] 7.3 确认无视觉回归（由用户本机验证）
- [ ] 7.4 提交并推送 GitHub
