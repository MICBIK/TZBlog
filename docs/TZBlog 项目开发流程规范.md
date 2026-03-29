# TZBlog 项目开发流程规范

## 目的

为 TZBlog 建立一套可长期执行的项目级开发流程，覆盖：

- 设计
- 开发
- 测试
- Bug 修复
- 发布与部署
- 文档同步
- Git 提交与代码管理

这套流程不是从零发明，而是结合成熟开源项目的通用做法做裁剪，目标是：

- 适合 `Astro + Payload CMS + PostgreSQL + Umami` 的完整前后端项目
- 适合人类开发者和 AI 协作者共同执行
- 适合后续使用 OpenClaw 持续参与开发
- 适合使用 `OpenSpec` 对每次正式变更做可追溯治理

## 参考来源

以下逻辑经过裁剪后吸收进本项目流程：

- Payload CONTRIBUTING
  https://github.com/payloadcms/payload/blob/main/CONTRIBUTING.md
  借鉴点：Monorepo、pnpm、设计变更需先讨论、测试分类、AI 协作约束
- Next.js Contributing / PR 描述
  https://github.com/vercel/next.js/blob/canary/contributing.md
  借鉴点：构建、测试、PR 描述拆分清楚
- Angular CONTRIBUTING
  https://github.com/angular/angular/blob/main/CONTRIBUTING.md
  借鉴点：Bug 必须有清晰问题描述、设计先行、Conventional Commits
- Changesets
  https://github.com/changesets/changesets
  借鉴点：Monorepo 中用变更记录管理发布和版本说明
- Umami README
  https://github.com/umami-software/umami/blob/master/README.md
  借鉴点：Docker 化部署、更新与重建流程
- OpenSpec
  https://github.com/Fission-AI/OpenSpec
  借鉴点：spec-driven change proposal、tasks 跟踪、archive 归档、长期可追溯

## 总原则

### 1. 先设计，后实现

- 改视觉、架构、内容模型、部署方式之前，先更新设计或技术文档
- 不允许边写代码边临时发明项目方向

### 2. 小步提交

- 每次变更都应形成一个原子提交
- 一个提交只做一类事情：
  - 文档
  - 骨架初始化
  - 某个页面
  - 某个 CMS 模型
  - 某个 Bug 修复

### 3. 先后台能力，再视觉特效

- 对 TZBlog 而言，内容后台、数据链路、页面骨架优先级高于 3D 特效
- 不允许在后台未打通前优先堆视觉层

### 4. 每次变更必须可验证

- 没验证的内容不能视为完成
- 验证不一定都要是完整自动化测试，但必须留下明确验证方式

### 5. 文档与代码同步

- 架构级、流程级、数据模型级改动必须同步更新文档
- 不允许代码和文档长期分叉

### 6. 正式变更必须先有 OpenSpec 记录

- 所有非琐碎改动默认先创建或继续一个 OpenSpec change
- 只有纯错别字、纯排版、纯路径修正这类无行为影响的小改动允许跳过
- 任何涉及功能、Bug、数据模型、部署、流程、依赖、文档契约的改动都应进入 OpenSpec

## 仓库工作流

### 任务来源

任何正式开发任务都应至少有一个明确来源：

- 设计文档中的待落地项
- GitHub Issue
- Bug 记录
- 部署 / 运维事项

不允许直接以“先写了再说”的方式进入实现。

### OpenSpec 变更治理

TZBlog 默认采用 `OpenSpec` 管理正式变更。

仓库内固定位置：

- `openspec/project.md`
  项目长期上下文和锁定方向
- `openspec/specs/`
  当前主线 capability specs
- `openspec/changes/<change-name>/`
  正在进行中的变更
- `openspec/changes/archive/`
  已完成并归档的变更记录

默认命令使用固定版本：

- `npx -y @fission-ai/openspec@1.2.0 list`
- `npx -y @fission-ai/openspec@1.2.0 new change <change-name>`
- `npx -y @fission-ai/openspec@1.2.0 validate <change-name> --type change --strict`
- `npx -y @fission-ai/openspec@1.2.0 archive <change-name> -y`

Change 名称统一使用 kebab-case，例如：

- `bootstrap-monorepo-foundation`
- `add-payload-post-collection`
- `fix-homepage-hero-layout`
- `deploy-staging-stack`

### 分支策略

默认采用简化版 GitHub Flow：

- `main`
  始终保持可恢复、可部署、可继续开发
- 功能分支
  本地或远程短分支，命名建议：
  - `feat/<topic>`
  - `fix/<topic>`
  - `docs/<topic>`
  - `chore/<topic>`

如果当前开发者或 AI 直接在本地仓库工作，允许先在本地短分支完成，再合并到 `main`。

### 提交规范

统一使用 Conventional Commits：

- `feat:`
- `fix:`
- `docs:`
- `refactor:`
- `test:`
- `chore:`
- `build:`
- `ci:`

推荐带 scope：

- `feat(web): build home page skeleton`
- `feat(cms): add post and project collections`
- `fix(web): correct article toc overflow`
- `docs(workflow): add project development standard`

### 提交要求

每次提交前至少完成：

- 本次改动目的明确
- 相关文件自检完成
- 验证命令已运行或验证方式已记录
- 如有文档影响，文档同步更新
- 如属正式变更，已存在对应 OpenSpec change 且 tasks 已同步

### 单任务执行闭环

每个任务默认按下面顺序推进：

1. 明确任务来源
2. 运行 `openspec list`，确认是否已有相关 active change
3. 没有则先创建 proposal / specs / design / tasks
4. 判断是否需要先更新设计或技术文档
5. 建立分支或确认当前分支用途单一
6. 实现改动并持续勾选 tasks
7. 执行最小必要验证
8. 更新相关文档
9. 验证 OpenSpec artifacts
10. 归档变更或明确保留为 active
11. 提交原子 commit
12. 合并前补齐 PR / 变更说明

## 设计流程

### 适用范围

以下改动必须先走设计更新：

- 首页结构变化
- 内容模型变化
- Payload collections / globals 调整
- 页面信息架构调整
- 3D Hero 交互策略变化
- 部署方式变化
- 数据统计方案变化

### 设计流程

1. 先阅读：
   - `README.md`
   - `docs/PROJECT_INDEX.md`
   - `openspec/project.md`
   - `docs/TZBlog OpenSpec 变更管理规范.md`
   - `docs/TZBlog 技术选型决策.md`
   - `docs/TZBlog 接管与启动指南.md`
2. 在对应 change 下先补 proposal / specs / design
3. 修改或补充设计文档
4. 明确影响范围
5. 再进入代码实现

### 设计产物

设计完成后，至少要落到以下文档之一：

- `docs/TZBlog 全新设计方案.md`
- `docs/TZBlog 技术选型决策.md`
- `/Users/baihaibin/Documents/ODWorkerSpace/博客/站点规划/TZBlog - 宇宙主题个人网站实现计划.md`

## 开发流程

### 开发前检查

开始任何开发前，先确认：

- 当前任务属于哪一层：
  - `web`
  - `cms`
  - `infra`
  - `docs`
- 是否涉及数据模型修改
- 是否需要同步更新文档
- 是否需要新增环境变量

### 推荐开发顺序

对 TZBlog，默认按以下优先级推进：

1. `infra`
2. `cms`
3. `web` 基础模板
4. 数据拉取链路
5. 搜索 / 统计 / SEO
6. Hero 3D 与视觉增强

### 开发约束

- 不直接重造后台功能
- 不直接重造统计系统
- 不在第一阶段写复杂 shader
- 不在页面骨架未稳定前写大量动画
- 不允许未建模就先硬编码内容结构

## 测试流程

### 测试分级

根据改动规模，执行不同级别验证。

#### A. 文档改动

- 检查文档是否可读
- 路径引用是否有效
- 入口索引是否更新

#### B. 前端 UI 改动

- 启动本地前端
- 检查页面是否能打开
- 核对主要路由
- 检查桌面与移动端主要布局

#### C. CMS / 数据模型改动

- Payload 能正常启动
- 新模型可创建、编辑、保存
- 必填字段校验正确
- API 能返回预期字段

#### D. 前后端联动改动

- Astro 能正确获取 Payload 数据
- 页面渲染字段不报错
- 构建流程可跑通
- Webhook 或重建触发逻辑可验证

#### E. 部署 / 基础设施改动

- Docker Compose 可启动
- 环境变量加载正常
- 健康检查通过
- 关键服务可访问

### 每次开发结束的最小验证

每次提交前，至少要执行与本次变更直接相关的验证。

不能只写“理论上可行”。

### 受限环境验证约束

当 TZBlog 在资源受限、共享、或对稳定性敏感的机器上开发时，默认只允许低负载验证：

- `lint`
- type generation
- 静态构建 / 编译测试
- `OpenSpec validate`

默认不要执行以下操作，除非用户明确要求：

- Docker 拉镜像
- 启动 PostgreSQL / 其他数据库容器
- 长时间本地服务运行验证
- 可能明显占满 CPU / 内存的重型本地检查

在这种环境下，运行时验证应交由用户在自己的机器上完成，再将报错或现象反馈回来处理。

同时必须补做以下流程级验证：

- `npx -y @fission-ai/openspec@1.2.0 validate --specs --strict`
- 如果本次存在 active change，再执行 `npx -y @fission-ai/openspec@1.2.0 validate <change-name> --type change --strict`

### 完成定义（Definition of Done）

一个任务只有同时满足以下条件，才算完成：

- 改动目标已经落地
- 与改动直接相关的验证已经完成
- 文档已同步，或明确标注本次无需更新文档
- 风险点和回滚方式可说明
- 已形成原子提交

## Bug 修复流程

Bug 修复必须按以下顺序：

1. 复现问题
2. 确认触发条件
3. 明确根因
4. 建立或继续对应 `fix-...` OpenSpec change
5. 用最小改动修复
6. 做回归验证
7. 更新 tasks / specs / proposal
8. 提交修复并记录影响范围

### Bug 提交建议

- `fix(web): correct project card layout overflow`
- `fix(cms): prevent empty slug save`
- `fix(infra): correct postgres healthcheck`

### Bug 记录要求

如果问题来源复杂，提交说明或 PR 描述至少写清：

- 现象
- 根因
- 修复方式
- 验证方式

## 发布与部署流程

### 开发环境

- `PostgreSQL` 用 Docker
- 对象存储本地优先可用 MinIO 模拟
- `Payload` 和 `Astro` 分开运行
- `Umami` 可延后接入，但环境变量先预留

### 发布前检查

发布前必须确认：

- 数据库备份方案明确
- 媒体存储路径正确
- Webhook 配置无误
- 前台构建成功
- CMS 可登录
- 关键页面可访问
- Umami 可采集数据

### 部署顺序

1. 备份数据库
2. 检查环境变量
3. 部署 / 更新 Payload
4. 部署 / 更新 Astro 前台
5. 部署 / 更新 Umami
6. 验证首页、文章页、CMS、统计

### 回滚策略

一旦发布异常，按以下优先级回滚：

1. 回滚前台版本
2. 如涉及 CMS 结构变动，回滚对应镜像与数据库迁移
3. 必要时恢复数据库备份

## 文档维护流程

以下场景必须同步更新文档：

- 新增 collections / globals
- 修改页面结构
- 修改技术栈
- 修改部署流程
- 修改环境变量
- 修改项目开发规范本身
- 修改 `openspec/project.md`
- 修改 `openspec/specs/`
- 新增或归档重要 change

优先更新：

- `README.md`
- `docs/PROJECT_INDEX.md`
- `docs/TZBlog 接管与启动指南.md`
- `docs/TZBlog OpenSpec 变更管理规范.md`

## AI / OpenClaw 执行规则

### 接手前必须读取

OpenClaw 或任意新的 AI 协作者接手前必须先读：

1. `README.md`
2. `docs/PROJECT_INDEX.md`
3. `openspec/project.md`
4. `docs/TZBlog OpenSpec 变更管理规范.md`
5. `docs/TZBlog 技术选型决策.md`
6. `docs/TZBlog 接管与启动指南.md`
7. `docs/TZBlog 项目开发流程规范.md`

### 执行要求

- 不得擅自改技术路线
- 不得回退到纯静态博客方案
- 不得跳过验证直接宣称完成
- 不得修改大方向而不更新文档
- 每次改动后必须形成原子提交
- 未创建或未接手 OpenSpec change 时，不得直接进入正式实现
- 在受限环境中，默认只做轻量验证，不得擅自启动 Docker / 数据库 / 长时间本地服务验证

### OpenClaw 默认执行顺序

OpenClaw 接手单个任务时，默认按以下顺序执行：

1. 读取接管文档、`openspec/project.md` 和流程规范
2. 运行 `openspec list`
3. 明确本轮任务边界
4. 判断是继续现有 change 还是新建 change
5. 判断是否需要先更新 proposal / specs / design
6. 只修改与当前任务直接相关的文件
7. 完成后执行最小必要验证和 `openspec validate`
8. 同步 tasks，必要时 archive
9. 生成原子提交
10. 在提交说明或 PR 描述中记录验证与风险

### 对 AI 最重要的约束

- 先结构后视觉
- 先内容后台后 3D 特效
- 先最小可运行链路后增强体验

## Pull Request 规范

PR 描述至少包含：

- 改动目标
- 影响范围
- 验证方式
- 风险点
- 是否需要更新环境变量 / 数据模型 / 文档

如果是 Bug 修复，还要补：

- 问题现象
- 根因
- 回归检查结果

## 第一个真正开发迭代的定义

第一个开发迭代的完成标准不是“首页特效上线”，而是：

- `apps/web` 已初始化
- `apps/cms` 已初始化
- `PostgreSQL` 可用
- `posts / projects / docs` 可在 Payload 后台创建
- Astro 首页能从后台拉到内容
- 至少有一个文章详情页跑通

## 最终结论

这套流程规范默认作为 TZBlog 后续长期开发的执行准则。

后续不管是人工开发还是 OpenClaw 参与，都应该按这份规范执行，而不是每轮重新发明流程。
