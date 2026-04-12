## Why

审计发现多个页面模式不一致：

1. Posts 列表页缺少 count badge，其他 3 个列表页都有
2. Projects 详情页 DetailSidebar 未传 tags prop，其他详情页都传了
3. 三栏布局 `.layout-firefly` 无移动端响应式适配，手机上溢出
4. 外部链接（ProjectCard 等）缺少 `target="_blank"` 的可访问性提示

## What Changes

1. `posts/index.astro`：CollectionHeader 添加 `count={posts.length}` 和 `unit`
2. `projects/[slug].astro`：DetailSidebar 添加 `tags={currentProject.tags}`
3. `global.css`：在 980px 和 720px 断点添加 `.layout-firefly` 响应式规则
4. `ProjectCard.astro`：外部链接添加 `aria-label` 提示

## Capabilities

### Modified Capabilities

- `platform-foundation`：页面模式统一，移动端适配完善

## Impact

- 影响 4 个文件，均为 UI/样式层面改动
- 不影响数据流和 API
