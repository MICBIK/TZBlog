## 前置条件

> 本 change 依赖 `build-payload-content-collections` 已完成。
> Payload CMS 在运行且存在已发布内容时，可进一步完成运行时验收；在受限环境中允许先完成静态收口与文档对齐。

## 1. 环境准备

- [x] 1.1 在 `apps/web/.env` 添加：`PAYLOAD_API_URL=http://localhost:3000/api`
- [x] 1.2 在 `apps/web/.env.example` 同步添加：`PAYLOAD_API_URL=http://localhost:3000/api`
- [x] 1.3 在 `apps/cms/src/payload.config.ts` 添加：`cors: ['http://localhost:4321'], csrf: ['http://localhost:4321']`

## 2. 创建 payload.ts API 层

- [x] 2.1 新建 `apps/web/src/lib/payload.ts`（完整代码见 design.md 第2节 + 方案文档第四章4.3节）
- [x] 2.2 确认 `fetchPayload` 函数包含错误降级（catch 返回 `{ docs: [] }`）
- [x] 2.3 确认 `flattenArray` / `flattenSections` 工具函数正确处理 Payload array 字段格式
- [x] 2.4 确认所有函数的 query 参数包含 `where[_status][equals]=published`
- [x] 2.5 去除前台对静态示例内容 fallback 的依赖，API 不可用时返回空集合而非假数据

## 3. 改造 Posts 页面

- [x] 3.1 修改 `src/pages/posts/index.astro`：用 `getPosts()` 替换 `import { posts }`
- [x] 3.2 修改 `src/pages/posts/[slug].astro`：用 `getPosts()` + props 直传替换静态数据与页面内重复请求
- [x] 3.3 为 posts 列表页补充 empty state
- [x] 3.4 精选位优先使用 `featured` 标记而不是简单取第一篇
- [ ] 3.5 在允许的环境中验证 `/posts` 列表来自 Payload
- [ ] 3.6 在允许的环境中验证 `/posts/<slug>` 详情正常渲染

## 4. 改造 Projects 页面

- [x] 4.1 修改 `src/pages/projects/index.astro`
- [x] 4.2 修改 `src/pages/projects/[slug].astro`
- [x] 4.3 为 projects 列表页补充 empty state
- [x] 4.4 去除项目详情页页面内的重复 slug 请求
- [ ] 4.5 在允许的环境中验证列表页和详情页正常

## 5. 改造 Docs 页面

- [x] 5.1 修改 `src/pages/docs/index.astro`
- [x] 5.2 修改 `src/pages/docs/[slug].astro`
- [x] 5.3 为 docs 列表页补充 empty state
- [x] 5.4 去除文档详情页页面内的重复 slug 请求
- [ ] 5.5 在允许的环境中验证列表页和详情页正常

## 6. 改造 Notes 页面

- [x] 6.1 修改 `src/pages/notes/index.astro`
- [x] 6.2 修改 `src/pages/notes/[slug].astro`
- [x] 6.3 为 notes 列表页补充 empty state
- [x] 6.4 补齐 `/notes` 的一级导航入口，确保 header / footer 可达
- [x] 6.5 去除笔记详情页页面内的重复 slug 请求
- [ ] 6.6 在允许的环境中验证列表页和详情页正常

## 7. 改造首页

- [x] 7.1 修改 `src/pages/index.astro`：在现有 5 段首页结构中，将 Recent Posts 区块切换为 `getPosts().slice(0,3)`
- [x] 7.2 为首页文章区块补充 empty state
- [x] 7.3 更新首页阶段文案为 `Phase 3 · CMS Content Integration`
- [ ] 7.4 在允许的环境中验证首页文章区块数据来自 Payload

## 8. 改造搜索页

- [x] 8.1 修改 `src/pages/search/index.astro`：searchIndex 改为构建时从4个 collection 动态生成（见 design.md 第3节搜索页部分）
- [x] 8.2 为搜索页首屏结果补充 empty state
- [ ] 8.3 在允许的环境中验证搜索页能搜到 Payload 中的内容

## 9. 全量验证

- [x] 9.1 完成静态代码与 OpenSpec / 方案文档对账
- [ ] 9.2 在允许的环境中运行 `cd apps/web && pnpm run astro check`，确认 0 errors
- [ ] 9.3 在允许的环境中确认 Payload CMS 运行中，运行 `astro build`，确认构建成功
- [ ] 9.4 在允许的环境中确认构建日志中无 `[payload] API unavailable` 警告
- [ ] 9.5 在允许的环境中验证草稿内容不进入前台构建产物

## 10. 清理

- [x] 10.1 删除 `content.ts` 中的静态内容数组（`posts` / `projects` / `docsCollection` / `notes` 变量），保留类型定义和非内容数据
- [x] 10.2 将 `content-fallback.ts` 降为占位文件，避免继续作为前台数据链路 fallback
- [ ] 10.3 在允许的环境中运行 `astro check` 确认删除后无类型错误

## 11. 收尾

- [x] 11.1 更新本 tasks.md 勾选完成项
- [ ] 11.2 提交 atomic commit：`feat(web): connect Astro frontend to Payload CMS REST API`
