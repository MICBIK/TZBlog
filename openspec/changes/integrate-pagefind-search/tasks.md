## 前置条件

> 无外部依赖。Pagefind 是纯静态构建工具，不需要运行时服务。

## 1. 安装 Pagefind

- [ ] 1.1 安装 `pagefind` 或 `astro-pagefind` 依赖
- [ ] 1.2 配置构建脚本，确保 `astro build` 后自动生成 Pagefind 索引

## 2. 标记内容页面

- [ ] 2.1 `posts/[slug].astro` 主内容区添加 `data-pagefind-body`
- [ ] 2.2 `projects/[slug].astro` 主内容区添加 `data-pagefind-body`
- [ ] 2.3 `docs/[slug].astro` 主内容区添加 `data-pagefind-body`
- [ ] 2.4 `notes/[slug].astro` 主内容区添加 `data-pagefind-body`
- [ ] 2.5 确认列表页、首页、about、lab 不被索引（不加 `data-pagefind-body` 即可）

## 3. 改造搜索页

- [ ] 3.1 移除 `searchIndex` 内存数组和 Payload API 调用（搜索页不再需要构建时拉取全部内容）
- [ ] 3.2 接入 Pagefind UI 或 Pagefind JS API
- [ ] 3.3 覆盖 Pagefind UI 样式以匹配暗色主题
- [ ] 3.4 保留搜索页壳层结构（eyebrow、标题）
- [ ] 3.5 保留或重新实现建议词功能

## 4. 验证

- [ ] 4.1 `pnpm build` 成功，`dist/pagefind/` 目录存在
- [ ] 4.2 `pnpm preview` 后搜索页能搜到文章正文内容
- [ ] 4.3 搜索结果链接正确跳转到详情页
- [ ] 4.4 无内容时搜索页显示友好提示
- [ ] 4.5 暗色主题下 Pagefind UI 视觉一致

## 5. 清理

- [ ] 5.1 移除搜索页中不再需要的 `getPosts/getProjects/getDocs/getNotes` 导入
- [ ] 5.2 移除搜索页中的 `<template id="search-card-tpl">` 和旧的 `script is:inline` 代码
- [ ] 5.3 更新搜索页描述文案（去掉"壳层"相关措辞）

## 6. 收尾

- [ ] 6.1 更新本 tasks.md 勾选完成项
- [ ] 6.2 提交 atomic commit：`feat(web): integrate Pagefind for full-text search`
