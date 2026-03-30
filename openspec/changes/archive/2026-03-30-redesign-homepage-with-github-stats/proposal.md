## Why

当前首页存在三个核心问题：

1. **没有个人身份**：Hero 区域只展示了"Dep Space Observatory"抽象概念，没有站主名字、角色定位和联系方式。访客打开首页不知道这是谁的博客。
2. *内容堆砌导致杂乱*：首页共 6 个 section，同一类内容（文章、项目、文档）反复出现在不同区块中，`/posts` 入口在页面上出现了 5 次。
3. **缺失差异化数据面板**：没有 GitHub 活跃度（贡献热力图）、开源项目 Star 实时数据、站点访问统计等运营型数据，导致首页没有"活的感觉"。
参考 anna.tf 的设计：Hero 只做身份表达（名字 + 角色 + 社交链接），内容精选不铺满，每类入口只出现一次。

## What Changes

1. **重构首页为 5 个职责清晰的 section**：
   - Hero：个人介绍 + 社交链接（学 anna.tf）
   - GitHub Activity：贡献热力图 + 开源项目卡片（含实时 Star 数）
   - Recent Posts：最新 3 篇文章精选
   - About / Tech Stack：简短 bio + 技术栈标签
   - Site Stats：站点访问统计（接 Umami API）

2. **删除冗余 section**：
   - 删除 Signal Grid（3 卡片，和 Recent Posts 重复）
   - 删除 Orbit Index 左栏导航（Header 已有）
  - 删除 Mission Panels（4 个入口，和 Header 完全重复）
   - 删除 Selected Works + Support Signals + Station Dock（内容第 2 次出现）

3. *新增数据能力**：
  - 集成 GitHub REST API 获取开源项目 Star 数
  - 集成 GitHub GraphQL API 获取贡献日历数据
   - 集成 cal-heatmap 渲染贡献热力图
  - 集成 Umami REST API 获取站点统计

## Capabilities

### Modified Capabilities

- `platform-foundation`: 首页从"内容堆砌的分发中枢"变为"有个人身份、有数据支撑的博客首页"

## Impact
- 主要影响 `apps/web/src/pages/index.astro`
- 新增 `apps/web/src/lib/github.ts`（GitHub API 工具函数）
- 新增 `apps/web/src/lib/umami.ts`（Umami API 工具函数）
- 新增 `apps/web/src/components/ContributionGraph.astro`
- 新增 `aps/web/src/components/ProjectCard.astro`
- 新增 `apps/web/src/components/SiteStatsBar.astro`
- 修改 `apps/web/src/data/content.ts`（新增 aboutProfile 字段、socialLinks 调整）
- 修改 `apps/web/src/styles/global.css`（新增首页专属样式）
- 新增依赖 `cal-heatmap`（~15KB gzip，纯 JS 热力图库）
- 不改动锁定技术栈，不改动列表页/详情页
