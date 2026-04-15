# Design: fix-frontend-ux-issues

## 1. 首页黑块问题 ✓ 根因确认

### 诊断结果

**位置**：`apps/web/src/styles/global.css:891-894`

**当前代码**：
```css
.home-hero-section {
  position: relative;
  overflow: hidden;
  /* 缺少 z-index 定义 */
}
```

**根本原因**：
- `.planet-background-container` 设置了 `z-index: -1`（global.css:464）
- `.home-hero-section` 没有明确的 `z-index`，默认为 `auto`
- 导致层级关系混乱，全屏固定定位的背景容器覆盖了首页内容

**层级关系图**：
```
.planet-background-container (fixed, z-index: -1)
    ↓ 应该在下方，但实际覆盖了内容
.home-hero-section (relative, z-index: auto)
    ↓
.hero-bg (absolute, z-index: 0)
    ↓
.hero-identity (relative, z-index: 1)
```

### 解决方案

```css
/* global.css:891-894 */
.home-hero-section {
  position: relative;
  overflow: hidden;
  z-index: 1; /* 添加此行，确保高于全局背景 */
}
```

## 2. 星场重叠问题 ✓ 根因确认

### 诊断结果

**位置**：
- SiteLayout.astro:24-26, 166-177 — 全局星场（5000 星点）
- HeroBackground.astro:10-13, 62-89 — 首页星场（800-2000 星点）

**当前实现**：

1. **SiteLayout 全局星场**（行 166-177）：
```ts
const starCount = 5000;
const sPos = new Float32Array(starCount * 3);
// ... 全屏固定定位，z-index: -1
```

2. **HeroBackground 首页星场**（行 62-89）：
```ts
const starCount = isMobile ? 800 : 2000;
const starPositions = new Float32Array(starCount * 3);
// ... 绝对定位在 section 内，z-index: 0
```

**重叠机制**：
```
SiteLayout 星场 (fixed, z-index: -1, 5000 星点)
    +
HeroBackground 星场 (absolute, z-index: 0, 800-2000 星点)
    =
首页显示 5800-7000 个星点，视觉混乱
```

### 解决方案

**方案 A（推荐）**：首页隐藏全局星场

```css
/* global.css，添加在 .planet-background-container 规则后 */
body:has(.home-hero-section) .planet-background-container {
  display: none;
}
```

**优点**：
- 首页仅显示 HeroBackground 的优化星场
- 其他页面保留全局星场
- 无性能损耗

**方案 B**：保持双星场，调整透明度

```css
.planet-background-container {
  opacity: 0.3; /* 降低全局星场透明度 */
}
```

**缺点**：仍有性能开销，不推荐

## 3. 限制 3D 星球旋转

### 当前实现分析

**位置**：`apps/web/src/layouts/SiteLayout.astro:198-227`

**当前代码**（行 200-216）：
```ts
const dragQuat = new THREE.Quaternion();
const _yAxis = new THREE.Vector3(0, 1, 0);
const _xAxis = new THREE.Vector3(1, 0, 0);

window.addEventListener('mousemove', (e) => {
  if (isDragging) {
    const dx = (e.clientX - lastX) * 0.012;
    const dy = (e.clientY - lastY) * 0.012;
    lastX = e.clientX; lastY = e.clientY;
    const qY = new THREE.Quaternion().setFromAxisAngle(_yAxis, dx);
    const qX = new THREE.Quaternion().setFromAxisAngle(_xAxis, dy); // X 轴自由旋转
    dragQuat.premultiply(qY).multiply(qX);
  }
});
```

**当前行为**：
- Quaternion 四元数旋转，无万向锁
- X 轴（垂直拖拽）：无限制，可导致星球上下颠倒
- Y 轴（水平拖拽）：无限制，正常左右旋转

**用户需求**：
- Y 轴：保持无限制旋转
- X 轴：限制倾斜角度 ±15°，避免颠倒

### 改进方案

**方案 A（推荐）**：改用 Euler 角度 + 限制

```ts
// 替换 Quaternion 为 Euler 角度控制
let dragRotationY = 0; // 累积 Y 轴旋转
let tiltX = 0;         // X 轴倾斜角度

const MAX_TILT = Math.PI / 12; // ±15°

window.addEventListener('mousemove', (e) => {
  mX = (e.clientX / window.innerWidth  - 0.5) * 2;
  mY = (e.clientY / window.innerHeight - 0.5) * 2;
  if (isDragging) {
    const dx = (e.clientX - lastX) * 0.012;
    const dy = (e.clientY - lastY) * 0.012;
    
    dragRotationY += dx; // Y 轴无限制累积
    tiltX = Math.max(-MAX_TILT, Math.min(MAX_TILT, tiltX + dy)); // X 轴限制
    
    lastX = e.clientX;
    lastY = e.clientY;
  }
}, { signal });

// 在 animate 函数中应用（行 220-227）
const animate = () => {
  const time = Date.now() * 0.001;
  autoRotY = time * 0.04;
  
  // 直接设置 Euler 角度
  planetGroup.rotation.y = dragRotationY + autoRotY;
  planetGroup.rotation.x = tiltX;
  planetGroup.rotation.z = 0; // 禁止 Z 轴旋转
  
  // 保持浮动效果独立
  planetGroup.position.y = Math.sin(time * 0.6) * 1.5;
  
  // ... 其余代码
};
```

**方案 B**：保留 Quaternion，限制 X 轴增量

```ts
// 在 mousemove 中限制 dy
if (isDragging) {
  const dx = (e.clientX - lastX) * 0.012;
  let dy = (e.clientY - lastY) * 0.012;
  
  // 检查当前 X 轴旋转角度
  const currentTiltX = planetGroup.rotation.x;
  const MAX_TILT = Math.PI / 12;
  
  // 限制 dy，避免超出范围
  if (currentTiltX + dy > MAX_TILT) dy = MAX_TILT - currentTiltX;
  if (currentTiltX + dy < -MAX_TILT) dy = -MAX_TILT - currentTiltX;
  
  const qY = new THREE.Quaternion().setFromAxisAngle(_yAxis, dx);
  const qX = new THREE.Quaternion().setFromAxisAngle(_xAxis, dy);
  dragQuat.premultiply(qY).multiply(qX);
}
```

**推荐**：方案 A，代码更简洁，性能更好

## 4. CMS 字段改进

### 方案对比

| 方案 | 优点 | 缺点 | 迁移成本 |
|------|------|------|----------|
| 仅添加中文 label | 零迁移成本，立即生效 | 仍需手动输入 textarea | 低 |
| textarea → richText | 支持富文本编辑 | 需要数据迁移 + 前端适配 | 高 |
| textarea → markdown | 支持 Markdown | 需要安装插件 + 前端渲染 | 中 |

### 推荐方案：分阶段实施

**Phase 1（本次）**：仅添加中文 label

```ts
// Posts.ts 示例
{
  name: 'title',
  type: 'text',
  label: '标题', // 添加中文
  required: true,
},
{
  name: 'summary',
  type: 'textarea',
  label: '摘要', // 添加中文
  required: true,
  admin: {
    description: '文章摘要，纯文本格式',
  },
}
```

**Phase 2（后续）**：评估 richText 迁移

如果后续需要 richText，Payload 3.x 内置 Lexical 编辑器：

```ts
{
  name: 'summary',
  type: 'richText',
  label: '摘要',
  required: true,
}
```

前端渲染需要安装 `@payloadcms/richtext-lexical`：

```astro
---
import { serializeLexical } from '@payloadcms/richtext-lexical/react'
const html = serializeLexical(section.content)
---
<div set:html={html} />
```

## 5. 实施顺序

1. **前端修复**（优先级高，影响用户体验）
   - 修复黑块问题
   - 修复星场重叠
   - 限制星球旋转

2. **CMS 改进**（优先级中）
   - 添加中文 label（零成本）
   - richText 迁移留待后续评估
