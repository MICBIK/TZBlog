# TZBlog 项目索引

## 项目目标

将原本偏单页交互展示的宇宙主题个人站思路，升级为一套可持续扩展的内容型博客方案，用于后续在 `TZBlog` 项目中直接落地开发。

## 当前开发基线

- 已建立 `pnpm workspace + turbo` monorepo
- 已建立 `apps/web` Astro 前台最小骨架
- 已建立 `apps/cms` Payload CMS 最小骨架
- 已建立 `infra/docker-compose.yml` PostgreSQL 本地开发环境
- 当前第一阶段已不再是“纯文档状态”

## 当前主文档

- `TZBlog 全新设计方案.md`
  当前唯一主设计文档，后续界面、架构、内容模型都以此为准。
- `TZBlog 技术选型决策.md`
  完整前后端架构的正式选型结论，后续技术实现以此为准。
- `TZBlog 接管与启动指南.md`
  接手文档，确保在上下文丢失后仍可直接开始项目。
- `TZBlog 项目开发流程规范.md`
  项目级执行规范，后续所有开发默认遵循它。
- `TZBlog OpenSpec 变更管理规范.md`
  OpenSpec 的执行手册，后续所有非琐碎变更默认先从这里进入。
- `../openspec/project.md`
  OpenSpec 项目基线，上下文恢复和创建新 change 前先读。

## 参考输入

- 原始设计草案
  `/Users/baihaibin/Documents/ODWorkerSpace/博客/站点规划/TZBlog - 宇宙主题个人网站实现计划.md`
- 参考项目
  `https://github.com/CuteLeaf/Firefly`
- 参考博客
  `https://coff0xc.xyz/`
- 参考博客
  `https://anna.tf/`
- 参考文章
  `https://firefly.cuteleaf.cn/posts/firefly-layout-system/`
- 在线效果
  `https://firefly.cuteleaf.cn/`
- 后台候选
  `https://github.com/payloadcms/payload`
  `https://github.com/TryGhost/Ghost`
  `https://github.com/halo-dev/halo`
  `https://github.com/strapi/strapi`
  `https://github.com/directus/directus`
- 统计系统
  `https://github.com/umami-software/umami`
- OpenSpec
  `https://github.com/Fission-AI/OpenSpec`

## Firefly 关键观察点

- `src/config/`
  将站点能力拆成配置层，适合后续把导航、主题、首页模块、列表模式做成可维护结构
- `src/layouts/MainGridLayout.astro`
  用统一布局承载横幅、主内容、双侧栏和浮动控件，说明“布局系统先行”是对的
- `src/styles/transition.css`
  页面切换以轻量过渡为主，适合作为 TZBlog 的动效边界参考
- `src/styles/waves.css`
  背景氛围层是可控、可降级、可按端裁剪的，不是无限叠特效
- `src/pages/search.astro`
  Pagefind 接入方式清楚，适合后续直接迁移为全文搜索能力
- `https://coff0xc.xyz/`
  内容组织、文章页结构、卡片系统、搜索与阅读体验成熟，适合作为内容层参考
- `https://anna.tf/`
  深空背景、Three.js 主行星、极简内容前景层很适合作为首页 Hero 氛围参考

## 已确认的设计结论

- 博客不再采用纯静态单页宇宙作品集方案
- 改为前后端分层架构
- 前台使用 `Astro`
- 后台使用 `Payload CMS`
- 数据库使用 `PostgreSQL`
- 数据统计使用 `Umami`
- 宇宙主题保留，但表达方式从“行星游乐场”改成“深空观测站 / 轨道中枢”
- 动效以导航反馈、页面过渡、层级显现为主，不再追求全局鼠标特效泛滥
- 桌面端允许使用多栏信息布局，移动端必须折叠为单列主内容流

## 后续开发建议顺序

1. 建立 Payload 内容模型与后台
2. 建立 Astro 前台数据拉取链路
3. 接入构建 Webhook 与 `Pagefind`
4. 接入 `Umami`
5. 最后补 Hero 3D、动效层和运营细节

## 后续更新约定

- 如果设计有重大变更，优先修改 `TZBlog 全新设计方案.md`
- 如果技术路线变化，优先修改 `TZBlog 技术选型决策.md`
- 如果需要给新的 AI 或协作者接手，优先看 `TZBlog 接管与启动指南.md`
- 如果需要执行具体开发工作，优先遵守 `TZBlog 项目开发流程规范.md`
- 如果需要发起、执行、归档一次正式变更，优先遵守 `TZBlog OpenSpec 变更管理规范.md`
- 如果只是开发进度推进，可在本文件下新增“开发记录”章节
- 新增参考资料时，只在本文件登记一次，避免多处重复维护
