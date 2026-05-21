# Spec — layout-integration

> Capability: `<AnalyticsBeacon>` 嵌入 site layout
> Stage: P2-Analytics §E
> SPEC-ID 前缀：`SPEC-A-L-`

## Domain rules

- `<AnalyticsBeacon />` 在 `src/app/(site)/layout.tsx` 内全局放置一份
- 仅 `(site)` 组生效；`(admin)` 组不会渲染（因为是不同 layout）→ 自动满足 admin 不上报

## Specs

### SPEC-A-L-1 — site layout 含 AnalyticsBeacon

**WHEN** 渲染 `<SiteLayout>{children}</SiteLayout>`
**THEN** DOM 含 `<AnalyticsBeacon />` 实例（通过 mock 子组件 testid 验证）
