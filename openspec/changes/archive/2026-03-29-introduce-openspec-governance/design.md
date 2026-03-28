## Context

TZBlog 目前尚未进入代码实现阶段，最适合在此时把变更治理规则一次性定下来。由于后续预期会有多 AI 协作，并且用户希望可以使用 OpenClaw 持续推进项目，所以流程不能只依赖当前某一种 AI 工具，而应以仓库内的工件和 CLI 命令为中心。

## Goals / Non-Goals

**Goals:**

- 为 TZBlog 建立可追溯的正式变更流程
- 让未来每个 feature / fix / infra / docs contract change 都有记录
- 让 OpenClaw 和其他协作者都能读同一套工件
- 把 OpenSpec 融入现有设计、开发、测试、部署流程

**Non-Goals:**

- 不在此变更中启动实际业务代码开发
- 不把流程绑定到某一款专有 IDE 或 AI 插件

## Decisions

- 使用 `@fission-ai/openspec@1.2.0` 作为当前固定 CLI 版本，避免 `latest` 漂移
- 使用仓库级 `openspec/` 工件作为唯一流程真相来源，而不是依赖工具专属目录
- 在 `openspec/specs/` 中建立 `platform-foundation` 和 `change-governance` 两个主线 capability specs
- 将本次引入 OpenSpec 的过程直接保留为 archive 记录，作为后续 change 的示例

## Risks / Trade-offs

- [流程成本上升] → 用“只对非琐碎变更强制启用”的规则控制成本
- [不同 AI 工具支持程度不同] → 统一以 markdown 工件和 shell 命令为中心
- [初期 specs 过粗] → 允许后续 change 持续细化主线 specs
