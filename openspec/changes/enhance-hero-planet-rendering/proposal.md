## Why

当前 TZBlog 首页 Hero 土星渲染效果已具备基础层次（本体、光晕、粒子环、星空、流星、小行星），但存在三个明显不足：

1. **星体表面平滑**：球体纹理仅使用 sin 波 + 随机噪声生成横向条纹，缺乏立体感，没有陨石坑质感，与宇宙主题「深空观测站」的气质不符。
2. **光环视觉薄弱**：几何环（RingGeometry）是单层平面，粒子环 y 轴厚度仅 ±0.25，整体偏薄，缺乏土星环应有的体积感和层次感。
3. **360° 拖拽存在万向节死锁**：当前旋转使用 Euler 角直接赋值，X 轴旋转接近 ±90° 时 Y 轴旋转失效或方向异常，用户拖拽体验不稳定。

## What Changes

- 为行星球体添加程序化 bumpMap，模拟月球/土星风格的陨石坑凹凸感，颜色与现有暖棕黄土星色系匹配
- 移除 RingGeometry 几何环，将其替换为更厚实的纯粒子环系统（增加粒子数量、y 轴厚度、径向密度梯度）
- 将拖拽旋转从 Euler 角累积改为 Quaternion 累积，彻底消除万向节死锁，使 360° 任意方向拖拽流畅

## Capabilities

### Modified Capabilities

- `platform-foundation`: 提升 Hero 3D 行星渲染品质，增强视觉真实感与交互稳定性

## Impact

- 仅影响 `apps/web/src/layouts/SiteLayout.astro` 中的 Three.js 渲染脚本
- 不改动页面结构、CSS、路由、数据模型
- 不引入新依赖（Three.js 已存在）
- 不影响 CMS、infra、其他页面
