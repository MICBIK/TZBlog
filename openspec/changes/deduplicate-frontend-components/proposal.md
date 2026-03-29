## Why

当前 TZBlog 前台 `apps/web/src/` 中存在大量结构化重复：

1. **三栏布局骨架** (`layout-firefly`) 在 10/12 个页面中复制粘贴了完全一致的 `left-rail / main-river / right-rail + animation-delay` 结构。
2. **文章内容渲染块** 在 4 个详情页中重复了 `sections.map → h2 + paragraphs + bullets` 逻辑，且 `notes/[slug]` 漏掉了 `bullets` 渲染和 `section.id` 属性（是实际 bug）。
3. **详情页左侧栏头部信息** 在 4 个详情页中各写一遍 eyebrow / title / summary / status-chips / tags 面板。
4. **大量重复 inline style**（`font-size: 0.9em` 12+ 次、`font-size: 1.05rem; line-height: 1.9` 4 次、`animation-delay` 30+ 次），使页面冗长且修改时容易不一致。
5. **导航链接在 3 处硬编码**：SiteHeader 正确使用了 `navItems`，但 SiteFooter 和首页 Orbit Index 硬编码了独立链接列表。
6. **搜索页 SR/CSR 卡片模板写了两遍**，改一处必须手动同步另一处。
7. **`content.ts` 中 4 个 `getBySlug` 函数同构且从未被调用**（死代码）。
8. **`global.css` 存在 CS 规则覆盖残留**，同一选择器定义了两遍、后者完全覆盖前者。

这些重复意味着：修改一处布局/样式需要同步 4-10 个文件，极易漏改导致页面不一致；代码膨胀降低了 blog 的工程质量感；后续接 Payload 真数据时会放大维护成本。

## What Changes

- 提取可复用 Astro 组件消除结构重复（三栏布局、文章内容区、详情侧栏、目录、列表页头部、推荐卡片）
- 将高频 inline style 提取为语义 CSS class
- 统一导航数据源，消除 Footer 和首页的硬编码链接
- 修复 `notes/[slug]` 缺失 `bullets` 渲染和 `section.id` 的 bug
- 修复 `posts/index` 列表缺少 `.content-stack` 包裹的不一致
- 用 `<template>` 元素统一搜索页 SSR/CSR 卡片模板
- 清理 `content.ts` 死代码和 `global.css` 覆盖残留

# Capabilities

### Modified Capabilities

- `platform-foundation`: 将前台从"复制粘贴式骨架"提升为"组件化、可维护的模板体系"

## Impact

- 主要影响 `apps/web/src/pages/**`、`apps/web/src/components/**`、`apps/web/src/styles/global.css`、`apps/web/src/data/content.ts`
- 预计新增 5-6 个 Astro 组件，减少约 40 行重复代码
- 不改变任何视觉输出和用户体验——纯内部重构
- 不改动锁定技术栈，不引入新依赖
