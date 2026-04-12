## Why

5 路并行审计发现 `add-tag-filter-pages` 变更引入了多个问题，按严重度分类：

### Critical / Major（必须修复）

1. **ContentCard `display: block` 覆盖全局 `display: flex`** — scoped `.card-link { display: block }` 覆盖了 global.css 的 `display: flex`，破坏卡片内部 space-between 布局，grid 变体尤其受影响
2. **ContentCard tags 区域丢失 padding** — tag-list 移出 `.card-link` 后不再继承 `padding: 1.2rem`，标签紧贴卡片边缘
3. **ContentCard 双 `.card-meta` 间距缺失** — meta 和 tags 拆分为两个独立 div，之间无间距控制
4. **`<>...</>` Fragment 短语法不兼容 Astro** — `[tag].astro` 使用了 `<>` 短语法，Astro 模板仅支持 `<Fragment>`
5. **标签 URL 未编码** — tag name 直接拼入 URL，含 `#`、`&`、空格等字符时路由失败
6. **搜索推荐词仅从 posts 提取** — 搜索覆盖全站四种集合，但推荐词只来自 posts
7. **中文标题分词无效** — `split(/[\s/]+/)` 对中文无效，整个标题作为一个推荐词
8. **getAllTags() 未过滤空白标签** — 空格字符串标签会生成空白卡片和无效 URL
9. **docs/notes 缺少 tag filter 区域** — 与 posts/projects 不一致

### Minor（应修复）

10. **global.css `.tag` 重复定义** — L432 和 L1094 两处定义属性完全不同，后者静默覆盖前者
11. **`[tag].astro` 内联样式** — `style="display: inline-block; margin-top: 0.5rem;"` 违反审计要求
12. **getAllTags() flatMap 缺少 `|| []` 防御** — 与列表页写法不一致
13. **Filters eyebrow 命名不一致** — posts 用 "Filters"，projects 用 "Project Tags"
14. **topTags 为空时显示空 panel** — 应条件渲染
15. **`.section-label` 应提到全局** — 通用分组标题样式不应 scoped
16. **ContentCard scoped `.tag-link:hover` 与全局 `.tag:hover` 冗余** — 应删除冗余规则

## What Changes

1. ContentCard.astro — 修复 card-link display、tags padding、meta/tags 间距、删除冗余 hover
2. tags/[tag].astro — `<>` 改 `<Fragment>`、内联样式提取为 class、`.section-label` 移到 global.css
3. payload.ts — getAllTags/getContentByTag 加 `|| []` 防御 + 空白标签过滤
4. 所有标签 href — 添加 `encodeURIComponent`
5. search/index.astro — 推荐词改为从全部集合的 tags 提取（不分词标题）
6. docs/notes index.astro — 添加 tag filter 区域
7. global.css — 合并重复 `.tag` 定义、新增 `.section-label` / `.back-link`
8. posts/projects index.astro — 统一 eyebrow 命名、空 topTags 条件渲染

## Capabilities

### Modified Capabilities

- `platform-foundation`：修复标签页面系统的视觉回归、URL 安全、一致性和健壮性问题

## Impact

- 修改 10 个文件
- 不新增文件
- 不影响数据模型
- 修复后所有列表页标签行为统一
