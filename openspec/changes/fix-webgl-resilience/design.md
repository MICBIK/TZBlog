# Design: fix-webgl-resilience

## SiteLayout.astro 改动

### 1. try-catch 包裹

整个 Three.js 初始化和动画循环包裹在 try-catch 中。失败时 console.warn 并隐藏 canvas。

### 2. AbortController 事件清理

```ts
const controller = new AbortController()
const { signal } = controller
window.addEventListener('mousedown', handler, { signal })
// ... 其他 listener 同理
```

页面卸载时 `controller.abort()` 自动清理所有监听器。

### 3. canvas fallback

```html
<canvas id="celestial-canvas">您的浏览器不支持 canvas 渲染</canvas>
```
