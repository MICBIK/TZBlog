# Spec — motion-system

## Unified motion and interaction system

### SCENARIO: motion-system-001

**GIVEN** 首页、文章列表、文章详情和后台编辑器都需要动效  
**WHEN** 实现 motion classes/hooks  
**THEN** 所有页面复用统一 duration、easing、distance、stagger token；不在组件内散落硬编码 animation values。

### SCENARIO: motion-system-002

**GIVEN** 用户系统设置 `prefers-reduced-motion: reduce`  
**WHEN** 打开任意前台页面或编辑器  
**THEN** reveal、stagger、持续循环动画和大幅 transform 被关闭或降级；内容仍立即可见。

### SCENARIO: motion-system-003

**GIVEN** 用户通过键盘导航链接、按钮、卡片和编辑器菜单  
**WHEN** focus 状态变化  
**THEN** focus ring、active state 和 hover state 一致可见；不依赖 hover-only 反馈。

### SCENARIO: motion-system-004

**GIVEN** 页面存在 client-side animated component  
**WHEN** Next.js SSR 和 hydration 完成  
**THEN** 不出现 hydration mismatch，不因初始 hidden 状态导致内容在无 JS 时不可见。

