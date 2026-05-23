# Spec — post-index

## Dense article index and discovery

### SCENARIO: post-index-001

**GIVEN** 访客打开 `/posts`  
**WHEN** 文章列表渲染  
**THEN** 每篇文章展示标题、摘要、发布时间、阅读时长、标签、专栏、浏览/评论/点赞摘要，并支持快速扫描。

### SCENARIO: post-index-002

**GIVEN** 访客使用标签、专栏、搜索或状态筛选  
**WHEN** 筛选条件变化  
**THEN** URL query 与页面结果同步，筛选 chip/empty state 清晰可见，返回/刷新后状态可恢复。

### SCENARIO: post-index-003

**GIVEN** 文章列表存在封面图、无封面图和长标题三种文章  
**WHEN** desktop 与 mobile viewport 渲染  
**THEN** 卡片高度和排版稳定，封面缺失不造成空洞，长标题不会遮挡元信息。

### SCENARIO: post-index-004

**GIVEN** 访客 hover 或 focus 文章卡片  
**WHEN** 交互触发  
**THEN** 卡片产生轻量状态反馈，键盘 focus 与 hover 有等价可见状态。

