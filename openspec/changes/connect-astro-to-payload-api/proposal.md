## Why

`build-payload-content-collections` change 完成后，Payload CMS 已具备完整内容模型，但 Astro 前台仍然从 `content.ts` 静态数据读取内容，两者之间没有数据链路。

本 change 的目标是将前台数据来源从硬编码静态数组切换为 Payload REST API，实现真正的前后端分离内容管理。

## What Changes

- 新建 `apps/web/src/lib/payload.ts`：统一的 Payload API 请求层，包含所有 collection 的 list 和 bySlug 方法
- 改造 8 个内容页面（4 个列表页 + 4 个详情页）：数据来源从 `content.ts` 切换为 `payload.ts`
- 改造首页 `index.astro`：最新文章和精选项目从 Payload API 获取
- 改造搜索页 `search/index.astro`：searchIndex 动态构建
- 在 `apps/web/.env` 中添加 `PAYLOAD_API_URL` 环境变量
- `content.ts` 中的静态内容数组（posts/projects/docsCollection/notes）在验证通过后可删除，类型定义保留

## Capabilities

### Modified Capabilities

- `platform-foundation`: 前台数据来源从硬编码静态数据切换为 Payload CMS REST API，实现真实内容管理链路

## Impact

- 主要影响 `apps/web/src/` 目录
- 依赖 `build-payload-content-collections` change 已完成且 Payload 正常运行
- 页面 HTML 结构、组件、CSS 全部不变，只替换数据来源
- 构建时需要 Payload CMS 在线（`http://localhost:3000`）
- 详细实现见 `design.md` 和 `docs/TZBlog CMS数据链路实现方案.md`
