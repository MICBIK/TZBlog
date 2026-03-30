## Why

顶部导航栏（`navItems`）中存在「搜索」条目（href=`/search`），同时 `SiteHeader` 右侧已有独立的 **Search Relay** CTA 按钮，两者指向完全相同的页面，功能无差别，构成冗余入口。

保留两个入口会带来以下问题：

- 视觉上重复，用户需要理解两个入口的区别（实际上没有区别）
- 进入 `/search` 页时，导航链接高亮 + CTA 按钮无高亮状态并存，视觉不一致
- Search Relay 按钮本身已作为强调 CTA 存在，设计意图清晰，不需要导航项作为补充

## What Changes

- 从 `navItems` 中移除 `{ label: '搜索', href: '/search' }` 条目
- Search Relay 按钮（`SiteHeader.astro`）保持不动，成为唯一搜索入口
- `/search` 页面路由、功能、JS 逻辑均不改动

## Capabilities

### Modified Capabilities

- `platform-foundation`: 收敛导航结构，消除重复搜索入口，以 Search Relay CTA 作为唯一搜索入口

## Impact

- 仅修改 `apps/web/src/data/content.ts` 中的 `navItems` 数组，删除一行
- `footerNavItems` 和 `mainContentNavItems` 均已过滤 `/search`，不受影响
- 搜索页路由、Search Relay 按钮、搜索功能全部不变
- 风险：极低
