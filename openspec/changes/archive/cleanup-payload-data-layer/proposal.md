## Why

`apps/web/src/lib/payload.ts` 存在三项审计遗留技术债：

1. **兼容兜底冗余**：第 4 行保留 `PAYLOAD_PUBLIC_URL` 兼容逻辑，当前正式入口已统一为 `PAYLOAD_API_URL`，兼容层可移除
2. **类型债**：`PayloadListResponse` 默认泛型参数为 `Record<string, unknown>`，多处接口使用 `PayloadTextItem = { [key: string]: string | undefined }` 代替精确类型
3. **死代码**：`getPostBySlug / getProjectBySlug / getDocBySlug / getNoteBySlug` 四个函数在详情页主链路已不再使用（详情页统一切到 `getStaticPaths()` + `Astro.props`），但仍导出

## What Changes

1. 移除 `PAYLOAD_PUBLIC_URL` 兼容层，API_URL 直接取 `PAYLOAD_API_URL`，缺省 fallback 为 `http://localhost:3000/api`
2. 删除未使用的 `getXxxBySlug` 四个函数
3. 替换 `PayloadTextItem` 为按字段命名的精确类型（如 `{ tag: string }` / `{ item: string }` / `{ text: string }`）

## Capabilities

### Modified Capabilities

- `platform-foundation`: 前台数据层代码更精确、无冗余导出

## Impact

- 仅影响 `apps/web/src/lib/payload.ts`
- 不改变任何页面行为
- 不改变 API 调用逻辑
