## Why

首页 Three.js 场景（200+ 行 WebGL 代码）无任何错误处理。WebGL 不可用时（低端设备、浏览器限制）页面崩溃。同时 4 个 `window.addEventListener` 无 cleanup，客户端导航时累积内存泄漏。canvas 元素无 fallback 文本。

## What Changes

1. `SiteLayout.astro`：Three.js 初始化代码包裹 try-catch，失败时静默降级
2. 添加 AbortController 管理所有 window 事件监听器的生命周期
3. canvas 元素添加 fallback 文本

## Capabilities

### Modified Capabilities

- `platform-foundation`：首页 3D 背景从脆弱渲染改为容错渲染

## Impact

- 仅影响 `apps/web/src/layouts/SiteLayout.astro`
- 不影响正常 WebGL 渲染效果
- 改善低端设备和无障碍访问体验
