## Why

项目设计方案明确保留宇宙主题（`openspec/project.md`："deep space observatory + main planet hero"），当前首页 Hero 区域仅有文字身份介绍，缺少视觉锚点。设计文档要求"深空背景、Three.js 主行星"作为氛围层，但优先级最低（Priority 5），需在内容管线完全就绪后实施。

参考 anna.tf 的方案：深空背景 + 低多边形行星 + 极简前景内容层，动效克制、可降级。

## What Changes

1. 在首页 Hero 区域添加 Three.js 深空背景（星空粒子 + 缓慢旋转的低多边形行星）
2. 背景层完全可降级：`prefers-reduced-motion` 时禁用动画、WebGL 不可用时显示 CSS 渐变替代
3. 不影响首页内容层的布局和交互

## Capabilities

### New Capabilities

- `hero-3d-visual`: 首页深空 3D 视觉氛围层

## Impact

- 新增 `apps/web/src/components/HeroBackground.astro` — Three.js 渲染组件
- 修改 `apps/web/src/pages/index.astro` — 引入 HeroBackground
- 修改 `apps/web/src/styles/global.css` — Hero 背景层样式
- 依赖 `three`（已安装，见 package.json）
