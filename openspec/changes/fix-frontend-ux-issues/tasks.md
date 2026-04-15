## 前置条件

> 无。

## 1. 修复首页黑块问题

- [x] 1.1 编辑 `apps/web/src/styles/global.css:891-894`
- [x] 1.2 为 `.home-hero-section` 添加 `z-index: 1`
- [ ] 1.3 本地测试：`pnpm dev:web`，检查首页黑块是否消失

## 2. 修复星场重叠问题

- [x] 2.1 编辑 `apps/web/src/styles/global.css`，在 `.planet-background-container` 规则后添加：
  ```css
  body:has(.home-hero-section) .planet-background-container {
    display: none;
  }
  ```
- [ ] 2.2 本地测试：滚动首页，确认星场不再重叠

## 3. 限制 3D 星球旋转

- [x] 3.1 编辑 `apps/web/src/layouts/SiteLayout.astro:198-227`
- [x] 3.2 替换 Quaternion 为 Euler 角度控制
- [x] 3.3 添加 `dragRotationY` 和 `tiltX` 变量
- [x] 3.4 设置 `MAX_TILT = Math.PI / 12` (±15°)
- [x] 3.5 修改 mousemove 事件：限制 X 轴倾斜
- [x] 3.6 修改 animate 函数：直接设置 `planetGroup.rotation.y/x`
- [ ] 3.7 本地测试：拖拽星球，确认仅左右旋转 + 轻微倾斜

## 4. CMS 字段中文化

- [x] 4.1 Posts.ts 所有字段添加中文 label
- [x] 4.2 Notes.ts 所有字段添加中文 label
- [x] 4.3 Docs.ts 所有字段添加中文 label
- [x] 4.4 Projects.ts 所有字段添加中文 label
- [x] 4.5 LabExperiments.ts 所有字段添加中文 label
- [x] 4.6 Media.ts 所有字段添加中文 label
- [x] 4.7 Users.ts 所有字段添加中文 label（无需添加字段，仅有默认 email）
- [x] 4.8 SiteProfile.ts 所有字段添加中文 label

## 5. 验证

- [ ] 5.1 本地启动前端，检查首页黑块是否消失
- [ ] 5.2 滚动首页，检查星场是否正常
- [ ] 5.3 拖拽 3D 星球，确认仅左右旋转 + 轻微倾斜
- [ ] 5.4 本地启动 CMS，检查所有字段是否显示中文
- [ ] 5.5 `pnpm build` 构建成功

## 6. 收尾

- [x] 6.1 修复 TypeScript 编译错误（安装 @payloadcms/translations）
- [x] 6.2 修复 CSS 语法错误（global.css:126 已正确）
- [x] 6.3 添加 Three.js 资源释放（防止内存泄漏）
- [x] 6.4 添加 Y 轴旋转模运算（防止数值溢出）
- [ ] 6.5 更新 tasks.md 反映实际进度
- [ ] 6.6 提交代码
