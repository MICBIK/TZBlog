# TZBlog

TZBlog 已完成设计基线和第一阶段工程骨架初始化，当前仓库已经具备 `Astro + Payload CMS + PostgreSQL` 的最小可运行结构。

## 阅读入口

1. `docs/PROJECT_INDEX.md`
   项目索引，总入口，后续继续分析和迭代时优先从这里开始。
2. `docs/TZBlog 全新设计方案.md`
   当前主方案，包含产品定位、界面结构、动效策略、技术架构和开发阶段拆分。
3. `docs/TZBlog 技术选型决策.md`
   完整前后端路线的正式决策文档，包含候选对比和最终结论。
4. `docs/TZBlog 接管与启动指南.md`
   给新的 AI 或协作者的接管文档，按它可以直接开始第一阶段开发。
5. `docs/TZBlog 本地启动与停止指南.md`
   本地运行手册，覆盖首次准备、启动、停止、访问地址和常见故障排查。
6. `docs/TZBlog 项目开发流程规范.md`
   项目级执行规范，覆盖设计、开发、测试、修复、部署与提交流程。
7. `docs/TZBlog OpenSpec 变更管理规范.md`
   变更治理手册，后续所有非琐碎变更默认先走 OpenSpec proposal / spec / tasks 流程。
8. `openspec/project.md`
   OpenSpec 的项目上下文基线，开始任何新变更前先读。

## 当前状态

- 已完成：参考 Firefly、Coff0xc、Anna 与现有 TZBlog 规划后的全新设计方案
- 已确认：`Astro + Payload CMS + PostgreSQL + Umami` 的完整前后端路线
- 已接入：`OpenSpec` 作为默认变更治理机制
- 已完成：`pnpm workspace + turbo` monorepo、`apps/web`、`apps/cms`、`infra/docker-compose.yml`
- 已完成：Astro 前台完整界面骨架，覆盖首页、文章、项目、文档、笔记、实验室、关于、搜索等核心路由
- 已验证：Astro 前台可构建、前台主要路由可访问、Payload CMS 可启动、本地 PostgreSQL 容器健康
- 进行中：内容模型、Payload globals、Astro 实际数据拉取、搜索真实索引、统计接入
- 暂未开始：3D Hero 与更高阶动效润色

## 当前选型

- 前台：`Astro`
- 后台：`Payload CMS`
- 数据库：`PostgreSQL`
- 统计：`Umami`
- 媒体：`S3 / R2`
- Monorepo：`pnpm workspace + turbo`

## 快速启动

1. 在仓库根目录复制环境变量：`cp .env.example .env`
2. 在 `apps/cms` 复制环境变量：`cp apps/cms/.env.example apps/cms/.env`
3. 启动 PostgreSQL：`pnpm db:up`
4. 安装依赖：`pnpm install`
5. 启动 Astro：`pnpm dev:web`
6. 启动 Payload CMS：`pnpm dev:cms`

默认地址：

- Web: `http://localhost:4321`
- CMS: `http://localhost:3000`
- Admin: `http://localhost:3000/admin`

如果需要更详细的首次启动、停止和排障说明，直接看：

- `docs/TZBlog 本地启动与停止指南.md`

## 设计原则

- 内容优先，不做只有视觉冲击但不利于阅读的单页炫技站
- 保留宇宙主题，但转成适合长期维护的技术博客表达
- 结构先清楚，再谈动效和氛围
- 配置驱动，方便后续调整导航、布局、模块和内容类型

## 参考来源

- 现有方案来源：
  `/Users/baihaibin/Documents/ODWorkerSpace/博客/站点规划/TZBlog - 宇宙主题个人网站实现计划.md`
- Firefly：
  `https://github.com/CuteLeaf/Firefly`
  `https://firefly.cuteleaf.cn/posts/firefly-layout-system/`
- Payload：
  `https://github.com/payloadcms/payload`
- Umami：
  `https://github.com/umami-software/umami`
- OpenSpec：
  `https://github.com/Fission-AI/OpenSpec`
