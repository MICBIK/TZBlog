# Design: enhance-hero-planet-rendering

## 1. 陨石坑 bumpMap 实现方案

### 原理

`MeshStandardMaterial.bumpMap` 接受灰度纹理，亮区 = 凸起，暗区 = 凹陷。通过 Canvas 2D API 程序化绘制若干圆形径向渐变来模拟坑洼轮廓，无需外部资源。

### 生成逻辑

```
generatecraterBumpMap()
  canvas: 1024 × 512
  底色: #888888（中灰，表示平坦基面）
  循环 180 次：
    随机位置 (x, y)
    随机半径 r = 8~60px
    绘制径向渐变：
      center (坑底): rgb(60,60,60)   → 暗 = 凹陷
      r*0.7 (坑壁):  rgb(180,180,180) → 亮 = 隆起边缘
      r*1.0 (坑外):  rgb(128,128,128) → 回归基面
  叠加高频噪声层（逐像素随机 ±12）增加粗粒感
```

### 材质参数

```js
material.bumpMap = generateCraterBumpMap();
material.bumpScale = 3.5;  // 可调，过大会出现锯齿
```

### 色调适配

diffuse 纹理保持现有暖棕黄（r≈140, g≈125, b≈100），bumpMap 是灰度独立通道，不影响颜色，只影响法线扰动，无需额外色调处理。

---

## 2. 粒子环重构方案

### 移除

删除 `RingGeometry` mesh 及 `generateRingTexture()` 函数（共约 20 行）。

### 新粒子环参数设计

```
totalParticles: 70000
分三层分布：

  Layer A — 内环 (r: 24~30)
    count: 8000
    ySpread: ±0.6
    size: 0.04~0.08
    density: 稀疏

  Layer B — 主环 (r: 30~44)
    count: 52000
    ySpread: ±2.0（内侧 ±1.2，外侧 ±2.0，线性插值）
    size: 0.06~0.18
    density: 最密

  Layer C — 外环 (r: 44~52)
    count: 10000
    ySpread: ±1.4
    size: 0.04~0.10
    density: 渐稀
```

### 颜色分布

```js
const s = 0.45 + Math.random() * 0.35;  // 亮度基值
r = s * (0.95 + Math.random()*0.1);
g = s * (0.85 + Math.random()*0.1);
b = s * (0.65 + Math.random()*0.1);
// 结果：暖沙/棕黄，与行星色系一致
```

### 材质

```js
new THREE.PointsMaterial({
  size: 0.12,          // 基础 size，vertexSizes 可扩展
  vertexColors: true,
  transparent: true,
  opacity: 0.75,
  blending: THREE.AdditiveBlending,
  sizeAttenuation: true
})
```

---

## 3. Quaternion 拖拽旋转方案

### 问题根因

当前代码：
```js
planetGroup.rotation.x = cRotX;
planetGroup.rotation.y = cRotY + time * 0.04;
```
Euler 顺序默认 XYZ，当 X 接近 ±π/2 时，Y 轴旋转退化为 Z 轴旋转（万向节死锁）。

### 解决方案

维护两个独立状态：
- `dragQuat`: 拖拽累积四元数（持久）
- `autoRotY`: 自动自转角度（每帧叠加）
- `mouseOffsetX/Y`: 鼠标视差偏移（惰性插值）

```js
// 拖拽时：
const yAxis = new THREE.Vector3(0, 1, 0);
const xAxis = new THREE.Vector3(1, 0, 0);
const qY = new THREE.Quaternion().setFromAxisAngle(yAxis, deltaX * 0.01);
const qX = new THREE.Quaternion().setFromAxisAngle(xAxis, deltaY * 0.01);
dragQuat.premultiply(qY).multiply(qX);

// 每帧合成：
const autoQ = new THREE.Quaternion().setFromAxisAngle(
  new THREE.Vector3(0,1,0), autoRotY
);
planetGroup.quaternion.copy(dragQuat).multiply(autoQ);
```

### 鼠标视差

相机位置继续使用现有 lerp 逻辑，不受 Quaternion 改动影响：
```js
camera.position.x += (mX * 12 - camera.position.x) * 0.015;
camera.position.y += (mY * -8 - camera.position.y) * 0.015;
camera.lookAt(planetGroup.position);
```

---

## 4. 改动范围

| 文件 | 改动类型 |
|------|----------|
| `apps/web/src/layouts/SiteLayout.astro` | 修改 Three.js 脚本块，约 +60 / -30 行 |

无新文件，无新依赖，无 CSS/HTML 改动。
