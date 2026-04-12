## 前置条件

> 无。

## 1. 修改 SiteLayout.astro

- [x] 1.1 Three.js 初始化代码已包裹 try-catch（此前迭代已完成）
- [x] 1.2 事件监听器已改用 AbortController 管理（mousedown/mouseup/mousemove/resize 全部传 signal）（此前迭代已完成）
- [x] 1.3 canvas 已有 fallback 文本 `您的浏览器不支持 canvas 渲染`（此前迭代已完成）

## 2. 验证

- [x] 2.1 `pnpm build` 构建成功（2026-04-12 验证通过）
- [ ] 2.2 正常浏览器中 3D 效果不变（需运行时验证）

## 3. 收尾

- [ ] 3.1 提交 atomic commit
