# Spec — article-experience

## Creative article reading experience

### SCENARIO: article-experience-001

**GIVEN** 访客打开文章详情页  
**WHEN** 文章渲染  
**THEN** 页面展示 editorial header、metadata、cover、正文、TOC、互动区和相关文章入口；阅读列宽保持舒适，右侧 rail 不压缩正文。

### SCENARIO: article-experience-002

**GIVEN** 文章内容包含 code block、callout、table、image、blockquote、list 和 inline code  
**WHEN** 发布态渲染  
**THEN** 所有 Markdown 元素沿用现有 `renderMarkdown` 管道，并在 light/dark 下视觉一致。

### SCENARIO: article-experience-003

**GIVEN** 文章配置了 interactive explainer block  
**WHEN** 访客进入该 block  
**THEN** block 可以承载轻量交互演示、step explanation 或 SVG/canvas visual；无 JS 或 reduced motion 下仍有静态 fallback。

### SCENARIO: article-experience-004

**GIVEN** 文章有多个 h2/h3 heading  
**WHEN** 访客滚动文章  
**THEN** TOC 和阅读进度跟随当前位置更新；更新过程不造成 layout shift。

