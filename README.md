# TZBlog

TZBlog 当前处于设计基线建立阶段，先统一产品方向、信息架构和技术方案，再进入实际开发。

## 阅读入口

1. `docs/PROJECT_INDEX.md`
   项目索引，总入口，后续继续分析和迭代时优先从这里开始。
2. `docs/TZBlog 全新设计方案.md`
   当前主方案，包含产品定位、界面结构、动效策略、技术架构和开发阶段拆分。
3. `docs/TZBlog 技术选型决策.md`
   完整前后端路线的正式决策文档，包含候选对比和最终结论。
4. `docs/TZBlog 接管与启动指南.md`
   给新的 AI 或协作者的接管文档，按它可以直接开始第一阶段开发。
5. `docs/TZBlog 项目开发流程规范.md`
   项目级执行规范，覆盖设计、开发、测试、修复、部署与提交流程。

## 当前状态

- 已完成：参考 Firefly、Coff0xc、Anna 与现有 TZBlog 规划后的全新设计方案
- 已确认：`Astro + Payload CMS + PostgreSQL + Umami` 的完整前后端路线
- 未开始：项目脚手架、CMS 接入、组件开发、样式实现、内容迁移

## 当前选型

- 前台：`Astro`
- 后台：`Payload CMS`
- 数据库：`PostgreSQL`
- 统计：`Umami`
- 媒体：`S3 / R2`

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
