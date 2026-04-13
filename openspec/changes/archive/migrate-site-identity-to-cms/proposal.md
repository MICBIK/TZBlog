## Why

当前站点身份信息（siteMeta、aboutProfile、socialLinks、navItems、pinnedRepos、timeline）全部硬编码在 `apps/web/src/data/content.ts`。CMS 已有 `SiteProfile` global，但前台仅对 about 页做了 CMS 读取 + fallback，首页和布局层仍直接读静态数据。

这导致修改站点名称、角色描述、社交链接等需要改代码重新构建，而不是在 CMS 后台编辑即可生效。

## What Changes

1. 扩展 Payload `SiteProfile` global，增加 `siteMeta` / `socialLinks` / `navItems` / `pinnedRepos` 字段组
2. 在 `payload.ts` 新增 `getSiteSettings()` 聚合函数，一次请求获取完整站点配置
3. 首页、布局、about 页统一从 CMS 读取站点身份，`content.ts` 中的静态数据降级为 fallback
4. `content.ts` 中保留类型定义和 fallback 值，删除 `currentStatus` 等过时字段

## Capabilities

### Modified Capabilities

- `platform-foundation`: 站点身份信息从硬编码升级为 CMS 可管理

## Impact

- 修改 `apps/cms/src/globals/SiteProfile.ts` — 扩展字段
- 修改 `apps/web/src/lib/payload.ts` — 新增 `getSiteSettings()`
- 修改 `apps/web/src/pages/index.astro` — 读取 CMS 站点配置
- 修改 `apps/web/src/layouts/SiteLayout.astro` — 读取 CMS siteMeta
- 修改 `apps/web/src/data/content.ts` — 降级为 fallback 角色
