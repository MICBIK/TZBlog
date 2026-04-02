## 执行环境约束

> **重要**：执行环境资源有限，**禁止运行以下命令**：
> - `pnpm install` / `npm install`
> - `pnpm build` / `astro build`
> - `pnpm dev` / `astro dev`
> - 任何长时间运行的进程
>
> 所有验证通过**代码审查**完成（检查文件内容是否正确），不通过运行构建完成。
> 构建验证由项目负责人在本地环境执行。

## 视觉约束

> **重要**：TZBlog 使用纯黑背景（#000000）+ Three.js 星空行星 3D 场景。
> - **禁止引入任何白色/亮色背景元素**
> - **禁止使用 Pagefind Default UI**（pagefind-ui.js / pagefind-ui.css 是白底的）
> - **必须使用 Pagefind JS API** 并复用现有暗色卡片样式
> - 搜索结果高亮（`<mark>` 标签）使用半透明白底，不用亮黄色

---

## 1. 添加 Pagefind 依赖

- [ ] 1.1 编辑 `apps/web/package.json`：在 `devDependencies` 中添加 `"pagefind": "^1.3.0"`
- [ ] 1.2 编辑 `apps/web/package.json`：修改 `build` 脚本为 `"astro build && pagefind --site dist"`

## 2. 标记内容详情页

在每个详情页的 `<Fragment slot="main">` 内，给 `<ArticleBody>` 组件包一层 `<div data-pagefind-body>`：

- [ ] 2.1 编辑 `apps/web/src/pages/posts/[slug].astro`：在 `<ArticleBody>` 外层包 `<div data-pagefind-body>`（注意上一篇/下一篇导航必须在该 div **外面**）
- [ ] 2.2 编辑 `apps/web/src/pages/projects/[slug].astro`：同上
- [ ] 2.3 编辑 `apps/web/src/pages/docs/[slug].astro`：同上
- [ ] 2.4 编辑 `apps/web/src/pages/notes/[slug].astro`：同上
- [ ] 2.5 **不要**在列表页、首页、about、lab、search 页面添加 `data-pagefind-body`（它们不需要被索引）

## 3. 改造搜索页

按照 `design.md` 第 3 节的完整代码重写 `apps/web/src/pages/search/index.astro`：

- [ ] 3.1 移除所有 Payload API 导入（`getPosts`、`getProjects`、`getDocs`、`getNotes`）
- [ ] 3.2 移除 `searchIndex` 数组构建逻辑
- [ ] 3.3 移除 `wordCounts` / `suggestedQueries` 动态提取逻辑（改为静态数组）
- [ ] 3.4 移除 `<template id="search-card-tpl">` 和旧的 `script is:inline` 代码
- [ ] 3.5 实现 Pagefind JS API 搜索（`import('/pagefind/pagefind.js')`），包含 try-catch 兜底
- [ ] 3.6 搜索结果用现有 `.search-card .panel` 样式渲染
- [ ] 3.7 添加 200ms debounce 防止频繁搜索
- [ ] 3.8 建议词按钮功能保留（点击填充输入框并触发搜索）
- [ ] 3.9 更新页面描述文案：去掉"壳层"/"演示"措辞，改为"全文搜索"

## 4. 添加搜索高亮样式

- [ ] 4.1 在 `apps/web/src/styles/global.css` 中添加 `.search-card mark` 样式（半透明白底高亮，见 design.md 第 3.3 节）

## 5. 代码审查验证（不运行构建）

- [ ] 5.1 确认 `package.json` 的 build 脚本包含 `pagefind --site dist`
- [ ] 5.2 确认 4 个详情页都有 `data-pagefind-body` 且位置正确
- [ ] 5.3 确认搜索页不再导入 `getPosts` 等函数
- [ ] 5.4 确认搜索页的 Pagefind import 有 try-catch 兜底
- [ ] 5.5 确认没有引入 `pagefind-ui.js` 或 `pagefind-ui.css`（禁止使用 Default UI）
- [ ] 5.6 确认没有引入任何白色/亮色背景样式

## 6. 收尾

- [ ] 6.1 更新本 tasks.md 勾选完成项
- [ ] 6.2 提交 atomic commit：`feat(web): integrate Pagefind for full-text search`
