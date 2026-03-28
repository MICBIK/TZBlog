# TZBlog 技术选型决策

## 目标

为 TZBlog 选定一套适合长期维护的完整前后端架构，避免自己重造博客后台、媒体管理、统计分析和日常运营工具。

最终要求：

- 前台可高度自定义
- 后台功能完整
- 内容模型支持文章、项目、文档、实验室
- 支持草稿、版本、媒体、权限
- 支持站点数据统计与分析
- 技术栈尽量现代，便于后续二次开发

## 候选项目

### Ghost

- Repo: https://github.com/TryGhost/Ghost
- 优点：
  出版、会员、订阅、Newsletter 很成熟，博客产品能力强
- 问题：
  更偏现代出版平台，不够适合 TZBlog 这种“文章 + 项目 + 文档 + 实验室”的多内容模型
- 结论：
  不作为首选

### Halo

- Repo: https://github.com/halo-dev/halo
- 优点：
  中文生态成熟，后台完整，插件和主题丰富，部署体验友好
- 问题：
  Java 技术栈与 Astro 前台割裂，做深度前后台协同时自由度较低
- 结论：
  适合作为成品博客系统，但不是 TZBlog 最优解

### Payload CMS

- Repo: https://github.com/payloadcms/payload
- 优点：
  TypeScript、现代、后台强、支持草稿、版本、权限、媒体、Hook，适合高度定制内容平台
- 问题：
  官方生态更偏 Next.js，和 Astro 对接需要按 headless 方式处理
- 结论：
  最适合 TZBlog

### Strapi

- Repo: https://github.com/strapi/strapi
- 优点：
  高 star、生态成熟、Headless CMS 能力强
- 问题：
  更偏通用 CMS，博客导向不如 Payload 灵活
- 结论：
  候选可行，但不作为首选

### Directus

- Repo: https://github.com/directus/directus
- 优点：
  管理 SQL 数据与后台面板能力很强
- 问题：
  更像数据中台，不够博客导向；许可策略也需要注意
- 结论：
  不作为首选

### Umami

- Repo: https://github.com/umami-software/umami
- 优点：
  现代、开源、自托管、隐私友好的统计系统，适合站点访问与事件分析
- 结论：
  作为 TZBlog 的统计分析层

## 最终结论

TZBlog 最终采用：

- 前台：`Astro`
- 后台：`Payload CMS`
- 数据库：`PostgreSQL`
- 媒体：`S3 / R2`
- 统计：`Umami`
- 搜索：`Pagefind`

## 选择理由

### 为什么前台保留 Astro

- 你当前的宇宙主题首页和内容页都需要高度自定义
- Astro 更适合内容站、SEO 和独立页面结构
- 不需要把前台绑死在某个现成博客模板里

### 为什么后台选 Payload

- 有成熟后台，不需要自写 CMS
- 内容模型足够灵活，能覆盖 `posts / projects / docs / notes / pages`
- 支持草稿、版本、权限、媒体、字段校验、Hook
- TypeScript 友好，后续扩展成本低

### 为什么统计选 Umami

- 自托管
- 界面成熟
- 支持页面访问与事件统计
- 不需要自写 PV / UV / 来源分析后台

## 架构落地方式

### 前后台职责

- Astro：
  对外站点展示层
- Payload：
  内容管理与发布层
- PostgreSQL：
  内容主库
- Umami：
  数据统计分析层

### 发布流程

1. 在 Payload 后台编辑内容
2. 内容写入 PostgreSQL
3. 媒体文件写入对象存储
4. 发布后触发 Webhook
5. Astro 拉取最新数据并重新构建
6. 构建完成生成 Pagefind 索引
7. Umami 继续记录访问与事件数据

## 后续执行原则

- 不自己重造 CMS
- 不自己重造统计系统
- Astro 只负责前台表现
- Payload 只负责内容管理与后台能力
- Umami 只负责统计与分析
- 所有新增功能先判断能否在既有系统上扩展，再决定是否自研
