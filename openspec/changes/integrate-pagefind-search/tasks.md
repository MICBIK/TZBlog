## 执行环境约束

> 已在本地环境完成。

## 1. 添加 Pagefind 依赖

- [x] 1.1 `apps/web/package.json` devDependencies 添加 `pagefind`
- [x] 1.2 build 脚本改为 `astro build && pagefind --site dist`

## 2. 标记内容详情页

- [x] 2.1 `posts/[slug].astro` 主内容区添加 `data-pagefind-body`
- [x] 2.2 `projects/[slug].astro` 主内容区添加 `data-pagefind-body`
- [x] 2.3 `docs/[slug].astro` 主内容区添加 `data-pagefind-body`
- [x] 2.4 `notes/[slug].astro` 主内容区添加 `data-pagefind-body`
- [x] 2.5 列表页/首页/about/lab/search 未添加（不索引）

## 3. 改造搜索页

- [x] 3.1 移除 Payload API 导入
- [x] 3.2 移除 searchIndex 内存数组
- [x] 3.3 建议词改为静态数组
- [x] 3.4 移除旧 template 和 script is:inline
- [x] 3.5 实现 Pagefind JS API 搜索（含 try-catch）
- [x] 3.6 使用现有暗色 .search-card .panel 样式
- [x] 3.7 200ms debounce
- [x] 3.8 建议词按钮功能保留
- [x] 3.9 更新页面文案

## 4. 搜索高亮样式

- [x] 4.1 global.css 添加 .search-card mark 样式

## 5. 构建配置

- [x] 5.1 astro.config.mjs 添加 rollupOptions.external 排除 pagefind.js
- [x] 5.2 构建通过：12 页索引、276 词

## 6. 验证

- [x] 6.1 `pnpm build` 成功，dist/pagefind/ 存在
- [x] 6.2 20 个 vitest 测试通过
- [x] 6.3 未引入 pagefind-ui.js/css（禁止 Default UI）

## 7. 收尾

- [x] 7.1 更新 tasks.md
- [ ] 7.2 提交 atomic commit
