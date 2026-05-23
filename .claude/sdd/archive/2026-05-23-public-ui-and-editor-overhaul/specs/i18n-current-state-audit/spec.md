# Spec — i18n-current-state-audit

> Capability：多语言现状审计文档化。
> 范围：本 spec 是**纯文档 capability**，不实施任何 i18n 路由 / dictionary 改动。
> 上游：`i18n-current-state.md`、`memory-bank/knownIssues.md:31-37` (KI-004)。

---

## I18N-1 审计文档落地

### I18N-1.1 文档存在

**GIVEN** `i18n-current-state.md` 已撰写
**WHEN** spec 通过
**THEN** 文档存在于 `.claude/sdd/public-ui-and-editor-overhaul/i18n-current-state.md`；含 §1-§15 完整章节；五分类标记表（§11）覆盖所有"看起来 i18n"的能力。

### I18N-1.2 文档与代码一致

**GIVEN** 文档列出 file:line 的 i18n 调用点
**WHEN** implementation 期间任何 i18n 相关代码改动
**THEN** 文档同步更新（如 `getCurrentLocale()` 行号变化、`PostEditor.tsx:122` 行号变化）；不允许"代码改了文档没改"。

---

## I18N-2 显式声明"中文单语言"

### I18N-2.1 About 页声明

**GIVEN** about-redesign spec A-8 要求 AboutFutureRoadmap 含 i18n 声明
**WHEN** 实施
**THEN** About 页 / `AboutFutureRoadmap.tsx` 渲染包含文字 "中文单语言"、"数据模型预留"、"V3 独立 SDD"。

### I18N-2.2 README 声明

**GIVEN** 项目 README.md
**WHEN** 实施
**THEN** README 中 "Features" 或 "Status" section 加一行明确："Currently a Chinese (zh-CN) single-locale blog. English translation capability is reserved in the schema and tracked for a future V3 SDD."

### I18N-2.3 sitemap / robots 注释

**GIVEN** `src/app/sitemap.ts` 和 `src/app/robots.ts`
**WHEN** 实施
**THEN** 文件顶部 JSDoc 注释明确："Single-locale sitemap. Multi-locale alternates pending V3 (`i18n-locale-routing-v3` SDD)."；不允许"看起来支持多语言"的 placeholder 字段（如 RSS 输出 `<language>multi</language>`）。

---

## I18N-3 不允许的假装

### I18N-3.1 不出现 locale switcher UI

**GIVEN** 任何前台页面
**WHEN** 实施完成
**THEN** Header / Footer / About / Home 不出现"中 / English" 切换按钮或 Select；不允许"看起来有切换其实没用"。

### I18N-3.2 不出现 hreflang / alternates 假数据

**GIVEN** metadata
**WHEN** generateMetadata
**THEN** 不允许在 metadata 中输出 `alternates.languages: { zh: "/", en: "/en" }`（因为 `/en` 不存在）；保持单 locale 干净输出。

### I18N-3.3 不出现 dictionary 假实现

**GIVEN** 任何文件
**WHEN** grep `dictionary\|t(\|messages\|locale=`
**THEN** 不应该有"看起来"接入 i18n lib 的 import / function 调用（除已有的 `getCurrentLocale` 自研最小 helper 之外）；不引入 next-intl / next-i18next 等假门面。

---

## I18N-4 V3 SDD 准入条件锁定

### I18N-4.1 准入清单存档

**GIVEN** `i18n-current-state.md §12` 列出 V3 SDD 准入条件
**WHEN** spec 通过
**THEN** 准入清单含业务前提 / 技术决策 / SEO/feed / admin 编辑 / 测试 / 不变量 六大类；每类至少 3 条；不允许"等以后再说"模糊表述。

### I18N-4.2 V3 SDD slug 占位

**GIVEN** V3 SDD 名称
**WHEN** 本轮归档
**THEN** memory-bank/progress.md V3 backlog 段更新，包含建议 SDD slug `i18n-locale-routing-v3`；当前 SDD 不创建该目录（V3 是独立 feature，不预先 squat）。

---

## I18N-5 UI 文案一致化（与 home-redesign / admin-readability 联动）

### I18N-5.1 删除明显的中英混杂

**GIVEN** 当前首页同时出现 "所有文章" 和 "View all"
**WHEN** 实施完 home-redesign H-9
**THEN** 首页 chrome 文案统一中文；详情页 stats 行的 "views/comments" 改成中文（"次浏览 · 条评论"）或保留英文但保证整页一致；不允许同一页面中英文混杂同义词。

### I18N-5.2 admin 文案一致

**GIVEN** admin 各页面 button / label / toast
**WHEN** 实施完 admin-readability
**THEN** 中文为主；技术术语保留英文（如 "Markdown" / "RSS" / "OG"）；不允许 button label 用 "Submit" / "Cancel"（改"提交" / "取消"）；不允许 toast 用 "Saved" （改"已保存"）。

### I18N-5.3 SiteHeader nav 文案决策

**GIVEN** 当前 `SiteHeader` 用 "Blog" / "Columns" / "About"
**WHEN** 实施
**THEN** **决策（home-redesign 实施时确定）**：
- 选项 A：全部中文 "文章 / 专栏 / 关于"
- 选项 B：全部英文 "Posts / Columns / About"
- **本轮推荐 A**（与 i18n-current-state §15 "中文单语言" 一致）

实施时如选 B，需在 design-notes "调整日志" 记录理由（如 "ha1den 偏好英文导航视觉")。

---

## I18N-6 测试覆盖

### I18N-6.1 文档存在断言

**GIVEN** 测试可能加 lint-like 检查
**WHEN** 实施
**THEN** 可选 `scripts/check-i18n-disclosure.ts`：grep README 含"single-locale"、grep AboutFutureRoadmap 含"中文单语言"；如果加则写入 `pnpm check:i18n-disclosure`。

### I18N-6.2 SiteHeader 文案测试

**GIVEN** `src/components/site/SiteHeader.test.tsx`（如有）
**WHEN** 实施 I18N-5.3 选 A
**THEN** 断言 nav text 含 "文章" / "专栏" / "关于"；不含 "Blog" / "Columns" / "About"。

### I18N-6.3 不允许 alternates 假数据测试

**GIVEN** generateMetadata 输出
**WHEN** 详情页 metadata 测试
**THEN** 断言 metadata.alternates 不存在 / 或 languages 字段不存在（不允许将来某 commit 偷偷加进来）。
