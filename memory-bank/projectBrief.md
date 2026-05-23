# Project Brief — TZBlog

## 一句话

TZBlog 是一个面向公开访问者的个人技术博客，强调「**写东西被看见**」，以简约大气的视觉语言（参考 Claude / Apple / OpenAI）承载个性化的自我表达与内容沉淀。

## 核心目标

1. **被看见**：通过 SEO、RSS、可分享的 OG 卡片让作者的内容触达陌生读者。
2. **可个性化**：首页是「介绍我自己」的舞台 —— 技术栈、动态状态、最近写的、GitHub 数据。
3. **掌控感**：从内容编辑到部署运维全栈自研，不被第三方 CMS / 第三方分析锁定。

## 目标用户

- **作者（管理员）**：HaiDen，单人维护。MVP 仅一个 admin 账号，但数据模型预留多作者扩展。
- **读者（公开访问）**：通过搜索引擎或链接进入的陌生访问者，无需注册即可浏览、点赞、评论。

## MVP 功能范围（5–7 周上线）

| 模块 | 范围 |
|---|---|
| 前台首页 | Hero + 技术栈展示 + 最新文章 + GitHub 实时数据 + Footer |
| 文章 | 详情页（Shiki 代码高亮 + TOC）、列表页、RSS、sitemap、OG 图 |
| 专栏 | 后台可创建专栏，前台展示专栏聚合页 |
| CMS（自研） | 登录、专栏 CRUD、文章 CRUD、Markdown source editor + split preview（存 Markdown）、媒体上传、评论审核 |
| 互动 | 浏览量（按 IP+UA 日内去重）、匿名点赞（同访客 24h 内一次）、匿名评论 + 后台审核 |
| 自研分析 | 全局 PageView 上报，后台基础仪表盘（UV/PV + 7 天折线 + 热门 Top 10） |
| 部署 | Docker Compose（Next + Postgres + MinIO + Caddy）在自有 VPS |

## 后续 backlog

以下内容是明确 backlog，不属于本轮 prelaunch-readiness；涉及 DB/UI/API/邮件/路由结构的项目都必须独立 SDD。

- **V2 backlog**：主题系统（CSS 变量 + 后台 GUI 编辑色板 + 一键切换）；详细 Analytics 仪表盘（来源/设备/国家/对比/导出）；评论邮件通知；编辑器增强（表格/脚注/数学公式/拖拽上传图片）；可能接 Giscus 作为评论备选。
- **V3 backlog**：多语言（zh / en），schema 已预留 `*Translation` 子表；需要补 locale routing、Header 切换器、英文内容录入与 SEO/RSS/sitemap 多语言策略。

## 关键约束

- **自研 CMS**：不使用 Payload / Strapi 等通用 CMS，二开成本不可接受。
- **自研分析**：不依赖 Umami / Plausible / GA，所有访问数据落到自有 Postgres。
- **VPS 自部署**：使用 Docker Compose，不上 Vercel / Cloudflare Pages。
- **单作者**：MVP 仅一个管理员账号，但 schema 中保留 `authorId` 外键。

## 成功指标

| 指标 | 目标 |
|---|---|
| 上线可访问性 | 公开 URL 可访问，HTTPS 自动续期正常 |
| Lighthouse | 桌面端 95+，移动端 90+ |
| 编辑体验 | 单篇 800 字带代码块带图文章 ≤ 20 分钟写完发出 |
| 反垃圾 | 评论审核队列每周 ≤ 30 条 spam，无漏放 |
| 自研分析 | 替代 Umami，能在仪表盘看清"今天有多少人访问、看了什么" |
| 主观标准 | "可以丢给陌生人浏览毫不尴尬" |

## 风险登记（高层）

- Markdown 复杂语法（脚注/数学/表格编辑辅助）会放大编辑器交互和渲染一致性成本 → MVP 保持 source-first，增强项进入 V2 独立 SDD
- VPS 4GB 内存跑五容器吃紧 → 优先选 Hetzner CX22 或更高配，加 swap
- 自研评论 spam 风险 → 后台审核 + IP rate-limit + 关键词黑名单
- 自研 Analytics 写放大 → MVP 同步写入，V2 评估异步队列
