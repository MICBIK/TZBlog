## 前置条件

> 本 change 依赖 `build-payload-content-collections` 已完成。
> Payload CMS 必须在 `http://localhost:3000` 运行，且已有至少1条已发布内容。

## 1. 环境准备

- [ ] 1.1 在 `apps/web/.env` 添加：`PAYLOAD_API_URL=http://localhost:3000/api`
- [ ] 1.2 在 `apps/web/.env.example` 同步添加：`PAYLOAD_API_URL=http://localhost:3000/api`
- [ ] 1.3 如遇 CORS 错误，在 `apps/cms/src/payload.config.ts` 添加：`cors: ['http://localhost:4321'], csrf: ['http://localhost:4321']`

## 2. 创建 payload.ts API 层

- [ ] 2.1 新建 `apps/web/src/lib/payload.ts`（完整代码见 design.md 第2节 + 方案文档第四章4.3节）
- [ ] 2.2 确认 `fetchPayload` 函数包含错误降级（catch 返回 `{ docs: [] }`）
- [ ] 2.3 确认 `flattenArray` / `flattenSections` 工具函数正确处理 Payload array 字段格式
- [ ] 2.4 确认所有函数的 query 参数包含 `where[_status][equals]=published`

## 3. 改造 Posts 页面

- [ ] 3.1 修改 `src/pages/posts/index.astro`：用 `getPosts()` 替换 `import { posts }`
- [ ] 3.2 修改 `src/pages/posts/[slug].astro`：用 `getPosts()` + `getPostBySlug()` 替换静态数据
- [ ] 3.3 启动 Astro dev，访问 `/posts`，确认文章列表来自 Payload
- [ ] 3.4 访问 `/posts/<slug>`，确认详情页正常渲染

## 4. 改造 Projects 页面

- [ ] 4.1 修改 `src/pages/projects/index.astro`
- [ ] 4.2 修改 `src/pages/projects/[slug].astro`
- [ ] 4.3 验证列表页和详情页正常

## 5. 改造 Docs 页面

- [ ] 5.1 修改 `src/pages/docs/index.astro`
- [ ] 5.2 修改 `src/pages/docs/[slug].astro`
- [ ] 5.3 验证列表页和详情页正常

## 6. 改造 Notes 页面

- [ ] 6.1 修改 `src/pages/notes/index.astro`
- [ ] 6.2 修改 `src/pages/notes/[slug].astro`
- [ ] 6.3 验证列表页和详情页正常

## 7. 改造首页

- [ ] 7.1 修改 `src/pages/index.astro`：recentPosts 从 `getPosts().slice(0,3)` 获取，featuredProjects 从 `getProjects().filter(p=>p.featured)` 获取（见 design.md 第3节首页部分）
- [ ] 7.2 验证首页文章区块和项目区块数据来自 Payload

## 8. 改造搜索页

- [ ] 8.1 修改 `src/pages/search/index.astro`：searchIndex 改为构建时从4个 collection 动态生成（见 design.md 第3节搜索页部分）
- [ ] 8.2 验证搜索页能搜到 Payload 中的内容

## 9. 全量验证

- [ ] 9.1 运行 `cd apps/web && pnpm run astro check`，确认 0 errors
- [ ] 9.2 确认 Payload CMS 运行中，运行 `astro build`，确认构建成功
- [ ] 9.3 确认构建日志中无 `[payload] API unavailable` 警告
- [ ] 9.4 草稿内容验证：在 Payload 创建草稿，确认前台构建产物不包含该内容

## 10. 清理

- [ ] 10.1 删除 `content.ts` 中的静态内容数组（`posts` / `projects` / `docsCollection` / `notes` 变量），保留所有类型定义和非内容数据（`navItems` / `siteMeta` / `socialLinks` / `pinnedRepos` / `searchIndex` 类型等）
- [ ] 10.2 运行 `astro check` 确认删除后无类型错误

## 11. 收尾

- [ ] 11.1 更新本 tasks.md 勾选完成项
- [ ] 11.2 提交 atomic commit：`feat(web): connect Astro frontend to Payload CMS REST API`
