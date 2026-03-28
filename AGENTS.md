# TZBlog Repo Rules

本仓库默认给 AI 协作者和 OpenClaw 使用，接手后先读：

1. `README.md`
2. `docs/PROJECT_INDEX.md`
3. `openspec/project.md`
4. `docs/TZBlog OpenSpec 变更管理规范.md`
5. `docs/TZBlog 技术选型决策.md`
6. `docs/TZBlog 接管与启动指南.md`
7. `docs/TZBlog 项目开发流程规范.md`

## 已锁定路线

- 前台：`Astro`
- 后台：`Payload CMS`
- 数据库：`PostgreSQL`
- 统计：`Umami`
- 搜索：`Pagefind`
- 媒体：`S3 / R2`

不要回退到纯静态博客方案，不要自研 CMS，不要自研统计后台。

## 执行顺序

默认优先级：

1. `infra`
2. `cms`
3. `web`
4. 搜索 / 统计 / SEO
5. 3D Hero / 动效增强

## 强制规则

- 改架构、数据模型、流程前，先更新文档
- 每次改动后形成原子提交
- 提交信息使用 Conventional Commits
- 每次改动必须有对应验证
- 先后台和数据链路，后视觉特效
- 单个任务只处理单一目标，避免把 docs / infra / web / cms 混成一次大改
- 提交前补齐验证记录，必要时同步到 PR 描述或 issue
- 所有非琐碎改动默认先创建或继续一个 OpenSpec change
- 开始实现前先运行 `npx -y @fission-ai/openspec@1.2.0 list`
- 实现过程中同步更新 `openspec/changes/<change-name>/tasks.md`
- 完成后先验证再归档 change，再提交 git commit

## 当前第一阶段目标

- 建立 monorepo
- 初始化 `apps/web`
- 初始化 `apps/cms`
- 接通 PostgreSQL
- 建立 Payload collections / globals
- 做出 Astro 首页与文章详情页最小骨架

## 参考规范

完整流程见：

- `docs/TZBlog 项目开发流程规范.md`
