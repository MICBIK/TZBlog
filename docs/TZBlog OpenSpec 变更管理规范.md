# TZBlog OpenSpec 变更管理规范

## 目的

为 TZBlog 建立一套可追溯的变更治理流程。

从现在开始，所有正式变更都尽量走同一条链路：

1. 先提 proposal
2. 再写 specs / design / tasks
3. 然后执行实现
4. 持续更新 tasks
5. 验证通过后 archive
6. 最后提交 git commit / PR

这样每次变更都能追溯到：

- 为什么做
- 改了什么要求
- 怎么实现
- 执行到哪一步
- 什么时候完成

## 采用方式

TZBlog 使用 OpenSpec 的仓库级工件和 CLI，而不是把流程绑定死到某一个 AI 工具。

已验证的官方 CLI 包：

- `@fission-ai/openspec`
- 当前接入版本：`1.2.0`

默认命令统一固定为：

```bash
npx -y @fission-ai/openspec@1.2.0 <command>
```

说明：

- OpenSpec CLI 当前没有专门的 `OpenClaw` tool adapter
- 因此本仓库采用工具无关的 `openspec/` 目录和命令式工作流
- 后续 OpenClaw 只要能读写仓库文件并执行 shell，就可以完整复用这套流程

## 仓库内固定位置

- `openspec/project.md`
  项目基线、锁定路线、能力边界
- `openspec/specs/`
  当前主线 specs
- `openspec/changes/<change-name>/`
  正在进行的 change
- `openspec/changes/archive/`
  已完成的 change 归档
- `openspec/AGENTS.md`
  给 AGENTS-compatible AI 的 OpenSpec 执行规则

## 哪些改动必须走 OpenSpec

以下改动默认必须创建或继续一个 OpenSpec change：

- 新功能
- Bug 修复
- 页面结构变化
- 数据模型变化
- Payload collections / globals 变化
- 部署、环境变量、监控、统计链路变化
- 依赖调整
- 设计方向和流程规范变化
- 任何会影响后续接手和协作认知的文档契约变化

以下改动允许跳过：

- 纯错别字
- 纯排版
- 不影响行为的路径修正
- 不改变事实和流程的微小表述整理

## 标准执行流程

### 1. 接手和确认上下文

先执行：

```bash
npx -y @fission-ai/openspec@1.2.0 list
```

然后阅读：

1. `openspec/project.md`
2. `openspec/specs/`
3. 当前 active change
4. `docs/TZBlog 项目开发流程规范.md`

### 2. 创建 change

如果当前没有合适的 active change：

```bash
npx -y @fission-ai/openspec@1.2.0 new change <change-name>
```

命名要求：

- kebab-case
- 直接描述变更目标
- 一个 change 只做一类事情

示例：

- `bootstrap-monorepo-foundation`
- `add-homepage-hero-shell`
- `fix-post-slug-validation`
- `deploy-staging-stack`

### 3. 完成变更工件

按 OpenSpec 的 spec-driven 思路补齐：

- `proposal.md`
  说明 why / what / impact
- `specs/<capability>/spec.md`
  说明 requirement 变化
- `design.md`
  非简单改动必须补 how
- `tasks.md`
  用复选框管理执行步骤

如果是简单小改：

- 可以不写复杂 design
- 但 proposal、specs、tasks 仍然建议完整

### 4. 验证工件

```bash
npx -y @fission-ai/openspec@1.2.0 validate <change-name> --type change --strict
npx -y @fission-ai/openspec@1.2.0 validate --specs --strict
```

验证不过，不进入实现。

### 5. 建分支并开始实现

建议分支名与 change 对齐：

- `feat/<change-name>`
- `fix/<change-name>`
- `docs/<change-name>`
- `chore/<change-name>`

实现过程中：

- 只做当前 change 范围内的事
- 完成一个任务就及时更新 `tasks.md`
- 如果需求或设计变化，先回写 proposal / specs / design

### 6. 提交前检查

提交前至少完成：

- 本次任务对应的 `tasks.md` 已更新
- 相关代码或文档验证已完成
- `OpenSpec validate` 已通过
- 需要更新的文档已同步

### 7. 归档变更

当 tasks 完成且验证通过后：

```bash
npx -y @fission-ai/openspec@1.2.0 archive <change-name> -y
```

归档后要确认：

- `openspec/specs/` 已反映最新主线要求
- `openspec/changes/archive/` 中已有该变更记录
- 仓库主文档未和最新要求脱节

### 8. Git 提交

最后再形成原子提交。

提交信息继续沿用 Conventional Commits，例如：

- `feat(web): bootstrap homepage shell`
- `fix(cms): prevent empty slug save`
- `docs(openspec): introduce spec-driven workflow`

## 紧急修复例外

如果是线上紧急故障：

1. 先止血
2. 当天补建 `fix-...` change
3. 回填 proposal / tasks / specs
4. 完成验证并 archive

紧急不等于可以永久跳过追溯。

## 推荐约定

- 一个 PR 对应一个主 change
- 一个 change 对应一个主要目标
- commit 可以多次，但不要跨多个 change 混做
- PR 描述里必须带上 OpenSpec change 名称

## 最后结论

从本规范开始，TZBlog 的默认开发方式从“先改代码再补说明”切换为“先建变更工件，再执行实现，再归档留痕”。
