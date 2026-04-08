## Why

About 和 Lab 页面仍使用 content.ts 静态数据，无法通过 CMS 后台管理。

## What Changes

1. CMS: 新建 `SiteProfile` Global（个人资料 + 时间线）
2. CMS: 新建 `LabExperiments` Collection（实验条目）
3. Web: payload.ts 新增 getSiteProfile / getTimeline / getLabExperiments
4. Web: about/lab 页面改为从 Payload API 获取数据，API 不可用时 fallback 到 content.ts

## Capabilities

### Modified Capabilities

- `platform-foundation`：About 和 Lab 从硬编码升级为 CMS 可管理

## Impact

- CMS 新增 1 个 Global、1 个 Collection
- Web 修改 2 个页面 + payload.ts
- 静态 fallback 保证 API 不可用时页面正常
