# Spec — editor

## Notion-like Markdown editor

### SCENARIO: notion-editor-001

**GIVEN** TZBlog 当前使用 CodeMirror source editor  
**WHEN** 开始替换为 Notion-like editor  
**THEN** 先实现候选 editor adapter POC，并用复杂 Markdown fixture 验证 import/export；未通过 POC 前不得大规模替换 `PostEditor`。

### SCENARIO: notion-editor-002

**GIVEN** 一段包含 heading、bold、italic、link、image、blockquote、table、code fence、GH alert、中文和 inline HTML 的 Markdown fixture  
**WHEN** fixture 导入 editor 后立即导出  
**THEN** 导出的 Markdown 必须保留发布所需语义；若字面值无法完全相同，必须记录可接受 normalization，并保证 `renderMarkdown` 输出 HTML 等价。

### SCENARIO: notion-editor-003

**GIVEN** 用户在空白编辑器中输入 `/`  
**WHEN** slash command menu 打开  
**THEN** 用户可以插入 heading、paragraph、bullet list、ordered list、blockquote、code block、image、table、callout；选择后插入对应 block 并保持键盘焦点。

### SCENARIO: notion-editor-004

**GIVEN** 用户选中文本  
**WHEN** bubble menu 出现  
**THEN** 用户可以执行 bold、italic、inline code、link、heading 转换；操作后保存 payload 输出对应 Markdown 语义。

### SCENARIO: notion-editor-005

**GIVEN** 用户点击 image block 或 slash command 的 image 项  
**WHEN** 媒体选择 dialog 打开并选中已有媒体  
**THEN** 编辑器插入图片 block，保存时输出 `![alt](url)` 或等价 Markdown，且不写入 base64/blob。

### SCENARIO: notion-editor-006

**GIVEN** 编辑器保存了一篇含 callout、code block、table、image 的文章  
**WHEN** 文章详情页发布态渲染  
**THEN** 发布态仍通过 `renderMarkdown` 输出 HTML；编辑器输出不得绕过 sanitize、Shiki、TOC、copy button 现有管道。

