# Context

当前前台由 12 个页面文件 + 4 个组件 + 2 个 Layout 组成，但页面之间存在大量结构性复制粘贴。本次重构只做**等价重构*——提取组件、统一数据源、清理冗余——不改变任何视觉输出。

# Goals / Non-Goals
**Goals**
- 消除跨页面的结构重复，使布局变更只需修改一处
- 提取高频 inline style 为语义 CSS class，提升可维护性
- 统一导航数据源，避免新增页面时多处漏改
- 修复分析中发现的 2 个隐藏 bug（notes bullets / posts content-stack）
- 清理死代码和 CSS 覆盖残留

**Non-Goals**

- 本轮不改变任何视觉输出或用户体验
- 本轮不引入新依赖或技术框架
- 本轮不调整页面路由或内容模型
- 本轮不做响应式断点补充（记录为后续 TODO）
## Design Directions
### 1. 组件提取策略（6 个新组件）

| 组件 | 职责 | 替代范围 |
|--|---|---|
| `ThreeColumnLayout.astro` | 三栏 `layout-firefly` 骨架 + 动画延迟 | 10 个页面的 `section.layout-firefly > aside + div + aside` |
| `ArticleBody.astro` | `sections.map → h2 + paragraphs + bullets` 渲染 | 4 个详情页的 article-content 块 |
| `DetailSidebar.astro` | 详情页左侧栏头部（eyebrow / title / summary / chips / tags） | 4 个详情页的 left-rail 头部面板 |
| `TableOfContents.astro` | 目录导航面板 | `posts/[slug]` 和 `docs/[slug]` 的右侧 TOC |
| `ColectionHeader.astro` | 列表页左侧 intro 面板（eyebrow / h1 / description / count） | 4 个列表页的 left-rail intro 面板 |
| `HighlightCard.astro` | 推荐/优先卡片（eyebrow / title / summary / button） | `posts/index` 和 `docs/index` 的右侧推荐 |

**设计原则：**

- 使用 Astro props 传递数据，named slots 传递扩展内容
- `ThreeColumnLayout` 提供 `left`、`main`、`right` 三个 named slot
- 组件接口保持最小必要属性，可选属性用 `?` 标注
- 不引入额外运行时——全部是 Astro 静态组件

### 2. CSS class 提取策略
从 30+ 处重复 inline style 中提取语义 clas：

```cs
/* 排版 */
.text-sm   { font-size: 0.9em; }
.prose-body { font-size: 1.05rem; line-height: 1.9; }
.detail-title { font-size: 2.2rem; }
.section-title { font-size: 1.5rem; }

/* 布局 */
.article-panel { padding: 2.5rem 2rem; }
.tag-list-flex { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.rail-list-col { display: flex; flex-direction: column; gap: 0.8rem; margin-top: 1rem; }
```

### 3. 导航数据统一

- SiteFooter: 从 `navItems` 过滤生成（排除 `首页` 和 `搜索`）
- 首页 Orbit Index: 从 `navItems` 过滤生成（只取 `/posts`, `/projects`, `/docs`, `/notes`）
- 新增 `content.ts` 导出 `mainContentNavItems`：从 `navItems` 筛选的内容类导航子集

### 4. Bug 修复

| Bug | 位置 | 修复 |
|---|---|
| `notes/[slug]` 缺少 `bullets` 渲染 | L36-44 | `ArticleBody` 组件统一包含 bullets 逻辑 |
| `notes/[slug]` 缺少 `section.id` | L38 | `ArticleBody` 组件统一输出 `id={section.id}` |
| `posts/index` 缺少 `.content-stack` 包裹 | L28 | 加上 `.content-stack` 容器，与其他列表页一致 |

### 5. 搜索页模板统一

将 SSR Astro 模板和 CSR JS 字符串模板合并为一个 `<template id="search-card-tpl">` 元素，CSR 端用 `cloneNode` + 填充数据，消除两处模板不一致风险。

## 6. 死代码清理
- 删除 `content.ts` 中 4 个未被引用的 `getPost/getProject/getDoc/getNote` 函数
- 合并 `global.css` 中被完全覆盖的重复规则

## Validation Plan

- 轻量验证：`astro check` + `astro build`
- 视觉验证：由用户在本机浏览确认无视觉回归
- 重构前后 build 输出应无差异（排除组件拆分导致的合理变化）
