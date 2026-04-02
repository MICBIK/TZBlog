## Why

搜索是 TZBlog 的一级导航能力（`openspec/project.md` 明确 Pagefind 为锁定选型）。当前搜索页 (`/search`) 仅使用构建时内存数组过滤（`searchIndex.filter`），无法支撑全文内容检索，也无法搜索文章正文中的关键词。

Pagefind 是 Astro 生态推荐的静态搜索方案，构建后自动生成索引，零运行时服务依赖。

## What Changes

1. 安装 `@pagefind/default-ui` 和 Astro Pagefind 集成（或手动 postbuild）
2. 在所有内容详情页添加 `data-pagefind-body` 标记，让 Pagefind 索引正文
3. 改造 `search/index.astro`：用 Pagefind UI 替换当前内存搜索
4. 保留搜索页壳层的视觉结构（eyebrow、标题、建议词），仅替换搜索引擎和结果渲染
5. 构建后验证 Pagefind 索引生成和搜索功能

## Capabilities

### Modified Capabilities

- `platform-foundation`：搜索从内存过滤壳层升级为全文索引搜索

## Impact

- 影响 `apps/web` 的搜索页、详情页、构建配置
- 不影响 CMS
- 不影响其他列表页
- 新增构建产物：`dist/pagefind/` 目录
