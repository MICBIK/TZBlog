# TZBlog 项目索引

## 项目目标

将原本偏单页交互展示的宇宙主题个人站思路，升级为一套可持续扩展的内容型博客方案，用于后续在 `TZBlog` 项目中直接落地开发。

## 当前开发基线

- 已建立 `pnpm workspace + turbo` monorepo
- 已建立 `apps/web` Astro 前台完整界面骨架与核心页面系统
- 已建立 `apps/cms` Payload CMS 最小骨架
- 已建立 `infra/docker-compose.yml` PostgreSQL 本地开发环境
- 已完成 `posts / projects / docs / notes` collections 注册
- 已完成 Astro 前台主内容页面到 Payload REST API 的主数据链路接入
- 已完成 SEO 基础配置（sitemap / robots.txt / OG meta / RSS feed）
- 已完成 Vercel 部署配置（web + cms vercel.json）
- 已完成站点身份 CMS 化（siteMeta / socialLinks / pinnedRepos 可后台管理）
- 已完成 S3/R2 媒体存储配置（代码就绪，待填写凭证）
- 已完成 Umami Analytics 集成（代码就绪，待部署实例）
- 已完成 Hero 3D 视觉增强（陨石坑 bump map / 土星环粒子系统 / Quaternion 拖拽）
- 已完成 Payload 数据层清理（移除冗余代码，精确类型定义）
- 当前阶段：Phase 4-5 完成，生产就绪，待运行时配置

## 当前主文档

- `TZBlog 全新设计方案.md`
  当前唯一主设计文档，后续界面、架构、内容模型都以此为准。
- `TZBlog 技术选型决策.md`
  完整前后端架构的正式选型结论，后续技术实现以此为准。
- `TZBlog 接管与启动指南.md`
  接手文档，确保在上下文丢失后仍可直接开始项目。
- `TZBlog 本地启动与停止指南.md`
  本地运行手册，适合下次独立启动项目时直接照着执行。
- `TZBlog 项目开发流程规范.md`
  项目级执行规范，后续所有开发默认遵循它。
- `TZBlog OpenSpec 变更管理规范.md`
  OpenSpec 的执行手册，后续所有非琐碎变更默认先从这里进入。
- `TZBlog CMS数据链路实现方案.md`
  当前 CMS collections 与 Astro 内容交付链路的主说明文档。
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

## 后续运行时配置

1. 部署 Umami Analytics 实例（Docker self-hosted 或 Umami Cloud）
2. 配置 S3/R2 存储凭证（可选，留空则使用本地存储）
3. 配置 Vercel Deploy Hook（可选，用于 CMS 发布自动触发构建）
4. 真实内容录入验证
5. 生产环境部署与监控

## 开发记录

### 2026-03-29

- 已将 `apps/web` 从最小占位页升级为完整前台界面骨架
- 已落地首页与核心列表/详情页模板
- 已建立一级导航与核心路由：`/posts`、`/projects`、`/docs`、`/notes`、`/lab`、`/about`、`/search`
- 已补充配置驱动的站点元信息层与类型定义

### 2026-04-02

- 已完成 Payload 内容 collections：`posts / projects / docs / notes`
- 已完成 Astro 前台主内容页面到 Payload REST API 的主数据链路接入
- 已移除前台主链路对示例内容 fallback 的依赖，API 不可用时改为 empty state
- 已完成一轮静态代码、OpenSpec 与项目主文档对账

### 2026-04-13

- 已完成 Phase 4-5 全部 7 个 OpenSpec changes：
  - `cleanup-payload-data-layer`: 清理数据层冗余代码与类型
  - `add-seo-optimization`: SEO 基础配置（sitemap/robots/OG/RSS）
  - `add-vercel-deployment`: Vercel 部署配置
  - `integrate-umami-analytics`: Umami Analytics 运行时集成
  - `configure-s3-media-storage`: S3/R2 媒体存储配置
  - `migrate-site-identity-to-cms`: 站点身份 CMS 化
  - `enhance-hero-3d-visuals`: Hero 3D 视觉增强
- 已通过 20 轮全量审计，发现并修复 1 个问题（Umami APP_SECRET）
- 已归档所有已完成的 changes 到 `openspec/changes/archive/`
- 当前状态：生产就绪，待运行时配置（Umami 部署 + S3 凭证）

## 后续更新约定

- 如果设计有重大变更，优先修改 `TZBlog 全新设计方案.md`
- 如果技术路线变化，优先修改 `TZBlog 技术选型决策.md`
- 如果需要给新的 AI 或协作者接手，优先看 `TZBlog 接管与启动指南.md`
- 如果需要执行具体开发工作，优先遵守 `TZBlog 项目开发流程规范.md`
- 如果需要发起、执行、归档一次正式变更，优先遵守 `TZBlog OpenSpec 变更管理规范.md`
- 如果只是开发进度推进，可在本文件下新增“开发记录”章节
- 新增参考资料时，只在本文件登记一次，避免多处重复维护
