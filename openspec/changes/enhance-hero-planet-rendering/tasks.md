## 1. OpenSpec 工件

- [x] 1.1 创建 change 目录结构
- [x] 1.2 撰写 proposal.md
- [x] 1.3 撰写 specs/platform-foundation/spec.md
- [x] 1.4 撰写 design.md
- [x] 1.5 撰写 tasks.md

## 2. 实现

- [x] 2.1 实现程序化 bumpMap 陨石坑纹理（generateCraterBumpMap）
- [x] 2.2 将 bumpMap 绑定到行星 MeshStandardMaterial
- [x] 2.3 移除 RingGeometry 几何环及 generateRingTexture
- [x] 2.4 重写三层粒子环系统（70000 粒子，分层 y 厚度）
- [x] 2.5 将拖拽旋转从 Euler 改为 Quaternion 累积
- [x] 2.6 验证自转、浮动、鼠标视差与 Quaternion 正确合成

## 3. 验证

- [x] 3.1 `astro check` 通过（SiteLayout.astro 无 TS 错误；about/index.astro 2 个错误为 pre-existing，与本次无关）
- [x] 3.2 `astro build` 构建失败原因为 pre-existing `cal-heatmap` 缺失依赖，与本次改动无关
- [ ] 3.3 本机目视验证：陨石坑凹凸可见
- [ ] 3.4 本机目视验证：粒子环有厚度感
- [ ] 3.5 本机目视验证：360° 拖拽无卡顿/反转

## 4. 收尾

- [x] 4.1 OpenSpec validate 通过
- [ ] 4.2 提交 atomic commit: `feat(web): enhance hero planet with crater bump, thick ring particles and quaternion drag`
