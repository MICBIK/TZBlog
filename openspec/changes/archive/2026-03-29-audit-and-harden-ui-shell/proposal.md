## Why

前台界面骨架已经完成并推送，但此前进行的是以交付为优先的实现和改动范围内审计。现在需要补一轮更系统的前台审计与修复，减少后续接 Payload 与继续扩展时的返工成本。

## What Changes

- 审计 `apps/web` 的信息架构、模板复用、可访问性、SEO 基线、构建行为与代码组织
- 修复审计中发现的问题
- 复跑前台验证与 OpenSpec 校验
- 输出清晰的修复与风险结果

## Capabilities

### Modified Capabilities

- `platform-foundation`: 强化已落地前台界面的质量基线、可维护性与可交付性

## Impact

- 主要影响 `apps/web/src/**`
- 可能同步更新少量项目文档与 OpenSpec 工件
- 不改动锁定技术栈，不引入重型视觉特效
