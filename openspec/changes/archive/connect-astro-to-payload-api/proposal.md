## Why

`build-payload-content-collections` change 完成后，Payload CMS 已具备完整内容模型，但 Astro 前台仍然从 `content.ts` 静态数据读取内容，两者之间没有数据链路。

本 change 的目标是将前台数据来源从硬编码静态数组切换为 Payload REST API，实现真正的前后端分离内容管理。

## What Changes

- 新建 `apps/web/src/lib/payload.ts`：统一的 Payload API 请求层，保留 collection list 方法为主，并继续保留 bySlug helper
- 改造 8 个内容页面（4 个列表页 + 4 个详情页）：数据来源从 `content.ts` 切换为 `payload.ts`
- 改造首页 `index.astro`：最新文章从 Payload API 获取，并保持现有 5 段首页结构不变
- 改造搜索页 `search/index.astro`：searchIndex 动态构建
- 在 `apps/web/.env` / `.env.example` 中明确 `PAYLOAD_API_URL` 为主用入口，并保留 `PAYLOAD_PUBLIC_URL` 兼容兜底
- 移除前台对静态内容 fallback 的依赖；当 API 不可用时返回空集合并渲染 empty state
- `content.ts` 中保留类型定义和非内容数据；旧静态内容数组迁出主数据链路

## Capabilities

### Modified Capabilities

- `platform-foundation`: 前台数据来源从硬编码静态数据切换为 Payload CMS REST API，实现真实内容管理链路

## Impact

- 主要影响 `apps/web/src/` 目录
- 依赖 `build-payload-content-collections` change 已完成且 Payload 正常运行
- 页面 HTML 结构、组件、CSS 主体保持不变，只替换数据来源与空态策略
- 构建时如果 Payload CMS 不可用，前台不再回退到示例内容，而是保留空集合并输出 warning
- 详细实现见 `design.md` 和 `docs/TZBlog CMS数据链路实现方案.md`
