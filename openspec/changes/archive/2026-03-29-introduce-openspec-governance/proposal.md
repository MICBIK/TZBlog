## Why

TZBlog 已经有设计、接管和开发流程文档，但还缺少对每一次正式变更的统一记录机制。引入 OpenSpec 可以把 proposal、requirements、tasks、archive 串成一条固定链路，避免后续多人或多 AI 协作时出现“改了什么、为什么改、做到哪一步”无法回溯的问题。

## What Changes

- 将 OpenSpec 作为 TZBlog 的默认正式变更治理机制
- 在仓库中建立 `openspec/` 目录、项目基线和主线 specs
- 将 OpenSpec 工作流接入现有 README、接管文档、开发流程规范和 PR 模板
- 为后续 OpenClaw / AI 协作建立工具无关的变更追踪方式

## Capabilities

### New Capabilities
- `change-governance`: 为 TZBlog 建立 proposal / specs / tasks / archive 的正式变更追踪能力
- `platform-foundation`: 为 TZBlog 固化当前已锁定的产品和架构基线，作为后续 change 的主线 spec 参照

### Modified Capabilities

## Impact

- 影响仓库协作方式和开发流程
- 新增 `openspec/` 目录和主线 specs
- 更新接管、流程、README、PR 模板
