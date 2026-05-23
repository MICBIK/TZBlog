# Spec — home-garden

## Creative technical garden homepage

### SCENARIO: home-garden-001

**GIVEN** 访客打开首页  
**WHEN** 首屏渲染  
**THEN** 页面展示 identity rail 与 content stream：身份简介、当前状态、最近文章、精选项目、社交/站点数据；不再只依赖传统 hero + section 堆叠。

### SCENARIO: home-garden-002

**GIVEN** 首页有文章、项目、GitHub 数据和站点统计  
**WHEN** 数据存在或为空  
**THEN** 每个模块都有明确 loading/empty/error 状态；不允许 silent failure 或空白卡片。

### SCENARIO: home-garden-003

**GIVEN** 访客使用移动端打开首页  
**WHEN** viewport 小于 tablet breakpoint  
**THEN** identity rail 折叠为顶部 profile summary，content stream 保持可读顺序，所有文字和按钮不溢出。

### SCENARIO: home-garden-004

**GIVEN** 首页模块进入视口或 hover  
**WHEN** 用户滚动或指向可交互元素  
**THEN** 页面使用统一 motion tokens 呈现轻量 reveal/hover feedback；`prefers-reduced-motion` 下动效关闭或降级。

