## Why

搜索是 TZBlog 的一级导航能力（`openspec/project.md` 明确 Pagefind 为锁定选型）。当前搜索页 (`/search`) 仅使用构建时内存数组过滤（`searchIndex.filter`），无法支撑全文内容检索——用户搜不到文章正文中的关键词，只能搜标题和摘要。

Pagefind 是 Astro 生态推荐的静态搜索方案，构建后自动生成索引，零运行时服务依赖。

## What Changes

1. 安装 `pagefind` 作为 devDependency，修改 build 脚本在 Astro 构建后运行 `pagefind --site dist`
2. 在 4 个内容详情页的主内容区域添加 `data-pagefind-body` 标记
3. 改造搜索页：使用 Pagefind JS API 替换内存过滤，**保持现有卡片样式和暗色视觉**
4. **不使用 Pagefind Default UI**（它是白底的，与 TZBlog 纯黑 + Three.js 星空背景完全冲突）

## Capabilities

### Modified Capabilities

- `platform-foundation`：搜索从内存过滤壳层升级为全文索引搜索

## Impact

- 仅影响 `apps/web`（搜索页、4 个详情页、构建配置）
- 不影响 CMS（`apps/cms`）
- 新增构建产物：`dist/pagefind/` 目录
