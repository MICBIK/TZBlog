## 1. 基线与准备

- [ ] 1.1 确认 `three` 依赖版本和当前项目中的使用情况
- [ ] 1.2 确认首页 Hero section 的 DOM 结构和样式
- [ ] 1.3 创建 design.md — 详细的 3D 场景设计（几何体、材质、光照、相机、动画参数）

## 2. 实现

- [ ] 2.1 创建 `HeroBackground.astro` — Canvas 容器 + Three.js 初始化脚本
- [ ] 2.2 实现星空粒子系统（BufferGeometry + PointsMaterial）
- [ ] 2.3 实现低多边形行星（IcosahedronGeometry + 自定义 ShaderMaterial）
- [ ] 2.4 实现缓慢旋转动画（requestAnimationFrame）
- [ ] 2.5 实现降级方案：WebGL 不可用时显示 CSS 渐变背景
- [ ] 2.6 实现 `prefers-reduced-motion` 支持：禁用动画，显示静态帧

## 3. 集成

- [ ] 3.1 在 `index.astro` Hero section 引入 HeroBackground
- [ ] 3.2 调整 Hero 区域 CSS：背景层 z-index 在内容层下方
- [ ] 3.3 确保移动端性能可接受（粒子数量适配、分辨率缩放）

## 4. 验证

- [ ] 4.1 `astro build` 构建正常
- [ ] 4.2 桌面端 Chrome/Firefox/Safari 视觉效果正确
- [ ] 4.3 移动端 Safari/Chrome 性能可接受（>30fps）
- [ ] 4.4 `prefers-reduced-motion` 开启时无动画
- [ ] 4.5 WebGL 不可用时 CSS 降级正常
- [ ] 4.6 Lighthouse Performance 评分 >90
