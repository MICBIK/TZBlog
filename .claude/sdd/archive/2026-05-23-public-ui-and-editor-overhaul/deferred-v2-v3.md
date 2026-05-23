# Deferred to V2 / V3 — public-ui-and-editor-overhaul

> 本轮**刻意不做**的事项。每项含背景、不做理由、正确进入点、相关 spec 链接。
> 与 `memory-bank/progress.md` "V2 backlog" / "V3 backlog" 段同步约束：本表的每条最终都应回流到 progress.md 对应位置。

---

## 0. 决策原则

- 本轮主线：**UI / 视觉 / 阅读体验 / 编辑契约**。
- 凡是涉及以下任一项就推后：
  - DB schema migration
  - API contract 改动
  - 路由树重构
  - 新一类基础设施依赖（邮件、CDN、第三方 SaaS）
  - 跨多 capability 的协议性改动（locale routing、theme schema）

V2 / V3 划分以"是否影响多语言能力"作为快速判据：与多语言强耦合的进 V3，其它独立 feature 进 V2。

---

## 1. V2 backlog

### V2-1：站点主题 GUI 编辑（`/admin/settings`）

**背景**：用户希望在后台可视化编辑 light / dark 调色板、保存多套主题、一键切换。当前 token 体系（`globals.css` @theme + :root / .dark）已为此预留。

**本轮不做的理由**：
- 需要 schema 改动（增加 `SiteTheme` 表或 `SiteConfig` JSON 字段）
- 需要后台新 page（`/admin/settings`），UI 设计独立 capability
- token 编辑要求 live preview，技术复杂

**正确进入点**：
- 等 P3 部署上线 + 实际访客数据后再判断 priority
- 独立 SDD slug：`theme-gui-v2`
- 入口 spec：`AR-1.2 sidebar 已删除 /admin/settings` → V2 重新加回时改回来

**依赖 / 影响**：
- 与 design-notes §2 token 设计直接相关（GUI 编辑的就是这套 token）
- 与 i18n V3 独立（互不阻塞）

---

### V2-2：详细 Analytics 仪表板（`/admin/analytics` 独立路由）

**背景**：当前 `/admin` dashboard 已有 4 metric cards + trend chart + top paths + distribution。V2 想拆分出来源 / 设备 / 国家 / 对比 / 导出 / 自定义 range / drill-down 等高级功能。

**本轮不做的理由**：
- dashboard 现状满足 MVP "替代 Umami" 目标
- 高级功能要求新 service + 大 query + 可能要 IP geo lookup（外部数据源）
- UI 复杂度高（多 chart / 数据透视）

**正确进入点**：
- 实际生产数据跑一阵后再定 priority
- 独立 SDD slug：`analytics-dashboard-v2`
- 入口 spec：当前 `/admin` 的 widgets 可以保留在 `/admin`，新 `/admin/analytics` 是 deep-dive

**本轮处理**：
- sidebar 已删除 `/admin/analytics` link（spec AR-1.2）
- 未来 V2 实施时重新加回

---

### V2-3：编辑器功能增强

**背景**：本轮 `editor-source-contract` 把编辑器换成 CodeMirror 6 source editor。还有一批想做的增强：

- **table wizard**：toolbar 中点 "Table" 弹 dialog 输入行列数后生成 markdown table 模板
- **拖拽上传图片**：编辑区拖入图片自动上传到 `/api/admin/uploads` 后插入 markdown image
- **脚注语法**：支持 `[^1]` 脚注（remark-gfm 已支持，preview 也通过；本轮已经渲染但 toolbar 无快捷）
- **数学公式 (KaTeX)**：支持 `$$...$$` 块和 `$...$` 行内公式
- **frontmatter editor**：metadata sidebar 改成更丰富的字段
- **历史版本 / 自动保存**：编辑期间每 N 秒自动 save draft
- **协作编辑**：单作者站点不需要，永久不做

**本轮不做的理由**：
- 增强项每个都是独立 micro-feature，混在本轮重做里风险高
- KaTeX 需要新依赖
- 自动保存需要新 API 状态机
- 拖拽上传需要扩展媒体 API

**正确进入点**：
- 独立 SDD slug：`editor-enhancements-v2`
- 优先级：拖拽上传 > table wizard > 自动保存 > KaTeX
- 实施时单独立 spec EE-* 系列

---

### V2-4：评论邮件通知

**背景**：访客提交评论后，作者收到邮件通知；访客评论被回复后，访客（如填了邮件）收到通知。

**本轮不做的理由**：
- 需要新邮件 infra（SMTP / SendGrid / Resend）
- 需要 schema 改（Comment 加 `notifyEmail` 字段）
- 与 anti-spam / opt-in 流程协调复杂

**正确进入点**：
- 独立 SDD slug：`comment-notifications-v2`
- 优先级：上线 + 实际访客评论流量超过 1/week 后再考虑

---

### V2-5：文章详情页阅读体验增强

**背景**：

- 阅读时间估算（"5 分钟阅读"）
- 阅读进度条（顶部 sticky）
- 上下篇文章导航（详情页底部）
- 相关文章推荐（基于 tag / column）
- 文章字数 / 修改时间显示

**本轮不做的理由**：
- 不属于"重做"范畴，是新功能
- 上下篇 / 相关推荐需要新 service query

**正确进入点**：
- 独立 SDD slug：`post-reading-experience-v2`
- 优先级：阅读时间 > 相关文章 > 进度条 > 上下篇导航

---

### V2-6：首页 / 列表页内容入口扩展

**背景**：

- 文章标签云 widget（首页 / sidebar）
- 热门文章 widget（按 viewCount 排序）
- "Now reading" widget（手动维护当前书目）
- 全文搜索（不只是 title 模糊匹配；本轮 PostsFilters 的 q 是简单 LIKE）

**本轮不做的理由**：
- 标签云 / 热门文章 OK 但属于增量，不阻塞本轮
- 全文搜索需要 Postgres FTS 或 MeiliSearch 引入

**正确进入点**：
- 独立 SDD slug：`content-discovery-v2`

---

### V2-7：Lighthouse 95+ 性能调优

**背景**：本轮内不强求 Lighthouse 分数；上线后实测可能需要调优。

**本轮不做的理由**：
- 必须基于线上 / production 环境的真实数据
- 调优常涉及 image optimization、第三方 script、bundle splitting，与本轮 UI 重做解耦

**正确进入点**：
- 独立 SDD slug：`lighthouse-optimization-v2`
- 上线后 1 周做 baseline 测量
- 优先：LCP > INP > CLS > TBT

---

### V2-8：媒体管理增强

- 媒体 alt text 编辑
- 媒体 tag / category
- 媒体批量删除
- 媒体引用追踪（哪篇文章用了这张图）

**本轮不做**：与本轮 UI 重做无强关联。

**正确进入点**：独立 SDD `media-management-v2`。

---

## 2. V3 backlog（i18n 相关）

### V3-1：多语言路由（`app/[lang]` 或同等）

**背景**：详见 `i18n-current-state.md §12`。

**本轮不做的理由**：
- 路由树整体迁移影响 ≥30 文件
- 涉及 metadata / RSS / sitemap 全链路改造
- 与本轮 polish 性质不同（这是 architectural rewrite）

**正确进入点**：
- 独立 SDD slug：`i18n-locale-routing-v3`
- 准入条件见 `i18n-current-state.md §12`：业务前提（真实英文内容来源）+ 技术决策（URL 风格、dictionary 选型）+ SEO/feed 全链路 + admin locale switch
- 不允许本轮"局部"做（如先做 dictionary 不做路由），那样产生半成品

---

### V3-2：动态 `getCurrentLocale()` 实现

**背景**：`src/lib/i18n.ts:6-7` 硬编码 `"zh"`。

**本轮不做的理由**：
- 改 `getCurrentLocale()` 实际无意义如果不同时做路由树
- 改动牵动所有 15 处调用点（`i18n-current-state.md §4`）

**正确进入点**：V3-1 SDD 内一并改

---

### V3-3：metadata / RSS / sitemap / OG 多 locale

**背景**：本轮 `i18n-current-state.md §5` 列出当前单 locale 输出。

**本轮不做**：与 V3-1 一并做。

**约束**：本轮严禁"伪多语言"输出（spec I18N-3）。

---

### V3-4：admin locale 切换 UI

**背景**：当前 `PostEditor.tsx:122` 硬编码 `locale: "zh"`。后台编辑器需要支持作者在 zh / en 翻译间切换。

**本轮不做**：与 V3-1 一并做。

**实施 hint**：
- PostEditor 容器顶部加 Tab "中文 / English"
- 切换时切换 `initial.content` 来源（不同 PostTranslation row）
- 提交时按当前 tab 决定 `locale` 字段
- 需要扩 API contract 允许 partial translation update

---

### V3-5：英文翻译内容来源决策

**背景**：V3 SDD 启动前需要回答：

- 谁负责英文翻译？人工 / 机器 / 半自动？
- 翻译质量门？谁审稿？
- 初版上线时是否要求所有文章都有英文版？还是允许 partial 显示原 zh + "English version not available" 提示？

**本轮不做**：纯业务决策，与代码无关。

---

## 3. 不做（永久 / 长期不做）

### N-1：替换 Auth.js / Next.js / Prisma 等基础设施

不做。当前选型已锁定。

### N-2：接 Giscus / Disqus 等三方评论

不做。自研评论已上线，与项目自托管理念一致。

### N-3：接 Umami / Plausible / GA

不做。自研 analytics 已替代。

### N-4：迁移到 Vercel / Cloudflare Pages

不做。VPS 自部署是项目核心约束。

### N-5：协作编辑

不做。单作者站点。

### N-6：Markdown WYSIWYG（rich-text）编辑

**永久不做**。本轮 `editor-source-contract` 已明确：编辑器是 markdown source editor，永不回到 ProseMirror 富文本路线。

### N-7：换 Astro / Hugo / Eleventy

不做。单体 Next.js 已是最终选型。

---

## 4. 不放进 V2 / V3 的灰色项（实施时再决定）

- **Playwright E2E 引入**：技术债务，等部署上线后单开 SDD `playwright-e2e-foundation`
- **Dockerfile + 部署 SDD（P3）**：与本轮 UI 重做解耦，独立 SDD `prelaunch-deploy-p3`
- **真实示例内容回填**：内容产出 task，不算工程 SDD
- **OG 图视觉重做**：可单做小 SDD `og-image-v1.1`

---

## 5. memory-bank 同步建议

实施 / 归档时同步以下 memory-bank 文件：

### 5.1 `memory-bank/progress.md`

更新 "V2 backlog" 段：

```markdown
## V2 backlog
- [ ] 主题系统 GUI（`theme-gui-v2`，独立 SDD）
- [ ] 详细 Analytics 仪表板（`analytics-dashboard-v2`，独立 SDD）
- [ ] 编辑器功能增强（`editor-enhancements-v2`，独立 SDD）— 含 table wizard / 拖拽上传 / KaTeX / 自动保存
- [ ] 评论邮件通知（`comment-notifications-v2`，独立 SDD）
- [ ] 文章阅读体验增强（`post-reading-experience-v2`）— 阅读时间 / 相关推荐 / 进度条
- [ ] 内容发现增强（`content-discovery-v2`）— 标签云 / 热门文章 / 全文搜索
- [ ] Lighthouse 95+ 性能调优（`lighthouse-optimization-v2`，等上线后基线）
- [ ] 媒体管理增强（`media-management-v2`）— alt / tag / 引用追踪
```

更新 "V3 backlog" 段：

```markdown
## V3 backlog
- [ ] 多语言全链路（`i18n-locale-routing-v3`，独立 SDD）— 详见 .claude/sdd/archive/YYYY-MM-DD-public-ui-and-editor-overhaul/i18n-current-state.md §12 准入条件
```

### 5.2 `memory-bank/knownIssues.md`

- KI-004 维持（本轮**不解决**多语言）
- 本轮如有新发现 issue（如 `_editor-demo` 路由长期保留的隐患），追加为 KI-005+

### 5.3 `memory-bank/systemPatterns.md`

- §13 Markdown 渲染管道：按本轮实际更新（加 light/dark 双主题、chrome bar、callout 全 token）
- §14 编辑器契约：按本轮 CodeMirror 6 实施更新

---

## 6. 一句话给 ha1den

本轮做且仅做 polish + 编辑器契约修复 + 必要的视觉重做；多语言 / 主题 GUI / 高级 analytics / 编辑器扩展 / 邮件 / 阅读体验增强 / 全文搜索 全部独立 SDD 推进。
