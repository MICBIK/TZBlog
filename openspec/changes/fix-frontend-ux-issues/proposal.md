## Why

根据用户提供的截图和代码审计，确认 4 个 UX 问题：

### 1. 首页黑块问题 ✓ 根因确认

**位置**：`apps/web/src/styles/global.css:891-894`

**根因**：`.home-hero-section` 缺少 `z-index` 定义，导致与 `.planet-background-container` (z-index: -1) 层级关系混乱。全屏固定定位的背景容器覆盖了首页内容区域。

### 2. 星场重叠问题 ✓ 根因确认

**位置**：
- `apps/web/src/layouts/SiteLayout.astro:24-26, 166-177` — 全局星场（5000 星点，fixed）
- `apps/web/src/components/HeroBackground.astro:10-13, 62-89` — 首页星场（800-2000 星点，absolute）

**根因**：两套独立星场系统同时渲染，造成视觉重叠。SiteLayout 的全局星场（z-index: -1）与 HeroBackground 的局部星场（z-index: 0）在首页同时显示。

### 3. 3D 星球旋转限制需求

**位置**：`apps/web/src/layouts/SiteLayout.astro:198-225`

**当前实现**：Quaternion 四元数旋转，支持 X/Y 双轴自由旋转（行 214-216）

**用户需求**：限制为仅 Y 轴（左右）旋转 + X 轴倾斜限制（±15°），避免星球上下颠倒

**注**：当前实现无技术问题，仅需调整交互限制

### 4. CMS 字段国际化缺失 ✓ 审计完成

**影响范围**：
- Posts.ts: 10 个字段无 label（title, slug, summary, category, orbit, publishedAt, readTime, featured, tags, sections）
- Docs.ts: 8 个字段无 label
- Notes.ts: 7 个字段无 label
- Projects.ts: 12 个字段无 label
- LabExperiments.ts: 5 个字段无 label
- Media.ts: 1 个字段无 label
- SiteProfile.ts: 18 个字段无 label（含嵌套字段）

**总计**：61 个字段缺少中文 label

**textarea 字段统计**：11 个字段使用 textarea（summary + sections.paragraphs.text）

## What Changes

### 前端修复（优先级：高）

1. **apps/web/src/styles/global.css:891-894**
   - 为 `.home-hero-section` 添加 `z-index: 1`，确保内容层级高于全局背景

2. **apps/web/src/styles/global.css:458-468**
   - 方案 A：首页隐藏全局星场（推荐）
     ```css
     body:has(.home-hero-section) .planet-background-container {
       display: none;
     }
     ```
   - 方案 B：保持 z-index: -1，但确保 `.home-hero-section` 的 z-index 正确

3. **apps/web/src/layouts/SiteLayout.astro:210-216**
   - 限制 X 轴旋转角度：
     ```ts
     let tiltX = 0;
     const MAX_TILT = Math.PI / 12; // ±15°
     if (isDragging) {
       const dx = (e.clientX - lastX) * 0.012;
       const dy = (e.clientY - lastY) * 0.012;
       dragRotationY += dx;
       tiltX = Math.max(-MAX_TILT, Math.min(MAX_TILT, tiltX + dy));
     }
     ```
   - 在 animate 函数中应用限制后的旋转

### CMS 改进（优先级：中）

4. **apps/cms/src/collections/Posts.ts**
   - 10 个字段添加中文 label（title, slug, summary, category, orbit, publishedAt, readTime, featured, tags, sections）

5. **apps/cms/src/collections/Docs.ts**
   - 8 个字段添加中文 label

6. **apps/cms/src/collections/Notes.ts**
   - 7 个字段添加中文 label

7. **apps/cms/src/collections/Projects.ts**
   - 12 个字段添加中文 label

8. **apps/cms/src/collections/LabExperiments.ts**
   - 5 个字段添加中文 label

9. **apps/cms/src/collections/Media.ts**
   - 1 个字段添加中文 label

10. **apps/cms/src/collections/Users.ts**
    - 检查并添加中文 label

11. **apps/cms/src/globals/SiteProfile.ts**
    - 18 个字段添加中文 label（含嵌套字段）

## Capabilities

### Modified Capabilities

- `platform-foundation`：修复首页 3D 渲染问题、限制星球旋转、改善 CMS 编辑体验

## Impact

### 前端
- 影响 2 个文件：`global.css`, `SiteLayout.astro`
- 无数据迁移需求
- 需要重新构建前端：`pnpm build`

### CMS
- 影响 7 个配置文件：Posts, Docs, Notes, Projects, LabExperiments, Media, Users, SiteProfile
- 仅添加 label，无数据结构变更
- 无数据迁移需求
- 需要重启 CMS：`pnpm dev:cms`

### 风险评估
- **低风险**：仅 CSS 样式调整 + 配置文件 label 添加
- **无破坏性变更**：不涉及数据库 schema 变更
- **向后兼容**：现有数据无需迁移
