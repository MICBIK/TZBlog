## Why

设计方案 Phase 3 明确要求"标签 / 分类 / 系列页"，但当前项目中：

1. 所有列表页（posts / projects / docs / notes）的标签仅为静态展示 `<span class="tag">`，不可点击
2. 没有 `/tags` 聚合页，用户无法按标签浏览跨集合内容
3. 没有 `/tags/[tag]` 详情页，无法查看某个标签下的所有内容
4. posts 列表页右侧的 Filters 区域有 topTags 但点击无响应
5. projects 列表页右侧的 Project Filter 是硬编码的 stage 标签（In Progress / Planned / Concept），同样不可点击

用户在阅读文章时看到标签却无法点击跳转，是一个明显的功能缺失。

## What Changes

1. 新增 `pages/tags/index.astro` — 标签聚合页，展示所有标签及其关联内容数量
2. 新增 `pages/tags/[tag].astro` — 标签详情页，展示某标签下所有集合的内容列表
3. 修改 `components/ContentCard.astro` — 标签从 `<span>` 改为 `<a>` 链接，指向 `/tags/[tag]`
4. 修改 `pages/posts/index.astro` — 右侧 Filters 区域的 topTags 改为可点击链接
5. 修改 `data/content.ts` — navItems 中添加"标签"入口（可选，或仅在 footer 中体现）
6. 新增 `lib/payload.ts` — 添加 `getAllTags()` 聚合函数，跨集合收集标签

## Capabilities

### Modified Capabilities

- `platform-foundation`：内容导航从"仅列表浏览"升级为"标签维度交叉浏览"

## Impact

- 新增 2 个页面文件，修改 3 个现有文件
- 不影响现有页面渲染结果（标签从 span 变为 a，视觉不变，增加可点击能力）
- 不影响数据模型，标签数据已存在于各集合的 tags 字段中
- 构建产物增加 `/tags` 和 `/tags/[tag]` 路由
