# i18n Current State Audit — TZBlog

> 截止 2026-05-23 的多语言现状审计。
> 本文是 `public-ui-and-editor-overhaul` 的交付物之一，**不**包含实施步骤。
> 实施由 V3 独立 SDD 负责（见末尾 §V3 准入条件）。

---

## TL;DR

**TZBlog 当前实现是一个中文单语言（zh）站点**，"看起来支持多语言"的部分全部是数据模型/类型签名预留，**不是**真支持。

| 维度 | 状态 |
|---|---|
| Prisma `*Translation` 子表 | ✅ 真实可用，已写入 zh 数据 |
| `SUPPORTED_LOCALES = ["zh", "en"]` 类型常量 | ✅ 存在 |
| `getCurrentLocale()` | ⚠️ **硬编码返回 `"zh"`**（`src/lib/i18n.ts:6-7`） |
| `app/[lang]` 路由 | ❌ 不存在 |
| proxy locale negotiation | ❌ 不存在 |
| dictionary / messages 体系 | ❌ 不存在 |
| `next-intl` / `next-i18next` 等 lib | ❌ 不使用，自研最小化 helper |
| `generateMetadata` locale-aware | ❌ 单 locale，无 alternates / hreflang |
| RSS / sitemap multilang 信号 | ❌ 单语；sitemap 无 `<xhtml:link rel="alternate">` |
| OG 图 locale-aware | ❌ 单语 |
| Header / Footer UI 文案 | ⚠️ **中英混乱硬编码** |
| PostEditor / ColumnFormDialog | ❌ 硬编码 `locale: "zh"` 提交，无 locale 切换 |
| KI-004 记录 | ✅ 已记录在 `memory-bank/knownIssues.md:31-37` |

**结论**：MVP 上线前不允许对外宣称"支持中英双语"。本文档化所有现状，并为 V3 独立 SDD 提供精确准入清单。

---

## 1. 核心 helper（i18n.ts）

`src/lib/i18n.ts` 全文 13 行：

```ts
1   export const SUPPORTED_LOCALES = ["zh", "en"] as const
2   export type Locale = (typeof SUPPORTED_LOCALES)[number]
3   export const DEFAULT_LOCALE: Locale = "zh"
4
5   /** MVP: 写死返回默认；V3: 从 cookies/headers/URL 解析 */
6   export function getCurrentLocale(): Locale {
7     return DEFAULT_LOCALE
8   }
9
10  export function isLocale(value: string): value is Locale {
11    return (SUPPORTED_LOCALES as readonly string[]).includes(value)
12  }
```

**事实**：

- 第 7 行硬编码返回 `"zh"`，**无任何动态读取**（cookie / header / URL）
- 第 5 行注释自承"V3 才动"
- 无 `Locale → translations dictionary` 映射函数
- 无 `localizePath(path, locale)` 工具
- 无 `pickTranslation<T>(translations, locale)` 工具（虽然各页面自己实现了 fallback 链）

---

## 2. Prisma schema 中的 Translation 子表（数据模型层）

`prisma/schema.prisma` 现存 translation 子表：

| 表名 | 父表 | 字段 | 行号 |
|---|---|---|---|
| `PostTranslation` | Post | `locale, title, excerpt, content, seoTitle?, seoDescription?` | 113-124 |
| `ColumnTranslation` | Column | `locale, name, description?` | 68-78 |
| Tag | （单表） | 无 TagTranslation | 130-136 |

**事实**：

- ✅ DB 可写入 zh + en 双语 row（schema 支持）
- ⚠️ 当前 seed (`prisma/seed.ts`) 只写 zh row
- ⚠️ 当前 admin UI 提交时硬编码 `locale: "zh"`（见 §6），即使 DB 接受 en row，也无 UI 路径让作者写入
- ❌ Tag 没有 translation 子表，意味着标签**永远是单语**（迁移 V3 需考虑加 TagTranslation 或保留单语）

---

## 3. 服务层（service / DB query）

| 文件 | 函数 | locale 参数 | 实际使用 |
|---|---|---|---|
| `src/lib/services/posts.ts:78` | `listPosts(filter, locale)` | ✅ 接收 | ✅ 用于 `where: { translations: { some: { locale } } }` |
| `src/lib/services/posts.ts` | `getPostBySlug(...)` | （看实现） | 不直接按 locale 过滤，调用方 pick translation |
| `src/lib/services/columns.ts:49` | `listColumnsForLocale(locale)` | ✅ 接收 | ✅ 过滤 |
| `src/lib/services/tags-public.ts:19-20` | `listAllTagsWithCount(locale)` | ⚠️ 接收但 `void locale;` **未使用** | 注释"reserved for future tag i18n" |
| `src/lib/services/stats.ts#getSiteStats` | （无 locale） | N/A | 全站聚合 |

**事实**：

- 服务层 **签名上支持多 locale**，调用方传 zh 时就过滤 zh row
- 服务层 **本身不调用** `getCurrentLocale()`，靠调用方传参（这是好设计）
- Tag 服务接收 locale 但忽略——形成 "API 假装支持但其实不支持"，需要 V3 改正

---

## 4. 路由 / 调用层（每个 page 怎么用 locale）

下表覆盖所有 public + admin 路由对 `getCurrentLocale()` / `DEFAULT_LOCALE` 的使用：

| 路由 | 文件 | 行号 | 用法 | 实际效果 |
|---|---|---|---|---|
| `/` | `src/app/(site)/page.tsx:13` | `const locale = getCurrentLocale();` → `listPosts({ ... }, locale)` | 永远查 zh |
| `/posts` | `src/app/(site)/posts/page.tsx:32` | `const locale = getCurrentLocale();` → `listPosts(filter, locale)` | 永远查 zh |
| `/posts/[slug]` | `src/app/(site)/posts/[slug]/page.tsx:44, 57` | `getCurrentLocale()` × 2（generateMetadata + page） | 永远查 zh |
| `/posts/[slug]/opengraph-image.tsx` | `:106, 115` | 不用 `getCurrentLocale()`，直接 `DEFAULT_LOCALE` fallback | 永远 zh，无 en |
| `/columns` | `src/app/(site)/columns/page.tsx:16` | `getCurrentLocale()` → `listColumnsForLocale` | zh |
| `/columns/[slug]` | `src/app/(site)/columns/[slug]/page.tsx:32, 48` | `getCurrentLocale()` × 2 | zh |
| `/tags` | `src/app/(site)/tags/page.tsx:13` | `getCurrentLocale()` → `listAllTagsWithCount(locale)`（**locale 参数被 service 忽略**） | 标签是全站单一 |
| `/tags/[slug]` | `src/app/(site)/tags/[slug]/page.tsx:41` | `getCurrentLocale()` | zh |
| `/about` | `src/app/(site)/about/page.tsx` | **不调用** `getCurrentLocale()`，内容硬编码 `src/lib/content/about.ts` | 永远 zh |
| `/admin/*` | `src/app/(admin)/admin/{posts,columns}/page.tsx` 等 | `getCurrentLocale()` | admin 也只能编辑 zh |
| `app/sitemap.ts:14-15` | `:14, 15` | 用 `DEFAULT_LOCALE` 调 `listColumnsForLocale` 和 `listAllTagsWithCount` | 单语 sitemap |
| `app/rss.xml/route.ts:10` | `:10` | 用 `DEFAULT_LOCALE` 调 `listPosts` | 单语 RSS |

**事实**：

- 共 **15 处** 调用 `getCurrentLocale()` 或 `DEFAULT_LOCALE`
- 全部最终查出 zh row
- 即使将来 `getCurrentLocale()` 改成动态返回，每个 page 还需检查 "fallback 行为正确"

---

## 5. SEO / metadata / OG / RSS / sitemap 现状

### 5.1 RootLayout metadata

`src/app/layout.tsx:42`:

```ts
openGraph: {
  locale: "zh_CN",   // hardcoded
  ...
}
```

- ❌ 无 `openGraph.alternateLocale`
- ❌ 无 `alternates.languages`
- ❌ `<html lang="zh-CN">` （RootLayout 中硬编码，无法 per-page 覆盖）

### 5.2 详情页 generateMetadata

`src/app/(site)/posts/[slug]/page.tsx:55-70`:

- ✅ 设 title / description（来自 `pickPostTranslation` 选中的 zh 翻译）
- ❌ 无 `alternates.languages = { zh: ..., en: ... }`
- ❌ 无 `openGraph.locale` 覆盖
- ❌ 无 `canonical` 自动设置

### 5.3 sitemap

`src/app/sitemap.ts`:

- ❌ 无 `<xhtml:link rel="alternate" hreflang="..." href="...">` 项
- ❌ 所有 entry 是单 URL（没有 zh/en pair）
- ✅ 只查 PUBLISHED + locale=zh column

### 5.4 RSS

`src/app/rss.xml/route.ts`:

- ❌ 无 `<language>zh-CN</language>` channel 元素（实测 grep 未见）
- ❌ 单 feed endpoint（不是 `/rss.xml/zh.xml` + `/rss.xml/en.xml`）

### 5.5 OG image

`src/app/(site)/posts/[slug]/opengraph-image.tsx`:

- ❌ 硬编码 English copy: `"TZBlog"`, `"ha1den · NOTES FROM THE FIELD"`
- ❌ 不按文章 locale 调整字体 / 文字方向 / 内容
- ❌ 单一图（不是 per-locale 多图）

### 5.6 robots.txt

`src/app/robots.ts`（如存在）/ root metadata：

- ✅ 已记入 `KI-003` follow-up 中
- ❌ 无 multi-locale 站点的 robots 信号（缺 `Sitemap: /sitemap.xml` 但需要 hreflang sitemap 时）

---

## 6. 后台编辑器与 admin 表单

| 文件 | 行号 | 硬编码 |
|---|---|---|
| `src/components/admin/posts/PostEditor.tsx:55` | `locale: "zh";` (type literal) | type 上写死 |
| `src/components/admin/posts/PostEditor.tsx:122` | 提交时 `locale: "zh"` | runtime 写死 |
| `src/components/admin/columns/ColumnFormDialog.tsx:89` | `initial.translations.find((t) => t.locale === "zh")` | 加载时只选 zh |
| `src/components/admin/columns/ColumnFormDialog.tsx:151` | 提交时 `locale: "zh"` | runtime 写死 |
| `src/components/admin/columns/ColumnsTable.tsx:78` | `translations.find((t) => t.locale === "zh") ?? translations[0]` | 显示时优先 zh |
| `src/components/admin/columns/ColumnsTable.tsx:167` | 提交时 `locale: "zh"` | runtime 写死 |

**事实**：

- 后台**完全没有 locale 切换 UI**
- 即使作者想在 admin 编辑 en 翻译，目前**没有路径**
- 表单 zod schema 接受多 locale（`src/lib/schemas/post.ts:17`, `src/lib/schemas/column.ts:15` 注释），但 UI 不暴露

---

## 7. UI 文案（chrome 级硬编码）

| 位置 | 文案 | 语言 | dictionary? |
|---|---|---|---|
| `src/components/site/SiteHeader.tsx:4-6` | `"Blog"`, `"Columns"`, `"About"` | 英文 | ❌ 硬编码 |
| `src/components/site/SiteFooter.tsx:8` | `"© 2026 HaiDen"` | 中英混 | ❌ 硬编码 |
| `src/app/(site)/page.tsx:34` | `"所有文章"` | 中文 | ❌ 硬编码 |
| `src/app/(site)/page.tsx:37` | `"View all"` | 英文 | ❌ 硬编码（**与"所有文章"同页**） |
| `src/app/(site)/page.tsx:45` | `"还没有发布的文章。"` | 中文 | ❌ 硬编码 |
| `src/app/(site)/posts/[slug]/page.tsx:81` | `"← 所有文章"` | 中文 | ❌ |
| `src/app/(site)/posts/[slug]/page.tsx:115-117` | `"views"`, `"comments"` | 英文 | ❌ |
| `src/app/(site)/tags/[slug]/page.tsx` | `"Tag not found"` | 英文 | ❌ |
| `src/lib/content/about.ts` | 全部 About 内容 | 中文 | ❌ 纯 object 无 locale 多版本 |
| `src/components/site/about/*.tsx` | 散文 + 列表 | 中文/英文 | ❌ 硬编码 |
| `src/app/(admin)/admin/**/*.tsx` | UI label / button | 中文为主 | ❌ |

**事实**：

- 同一页面同时存在中英文硬编码（典型例：首页"所有文章" + "View all"）
- 没有任何 `t("...")` / messages.json / messages-en.json / dictionary 机制
- 不仅 V3 重做，本轮**应在 UI 文案上至少做一致化**（要么全中、要么全英；本轮决策："chrome 文案统一中文"，详见 home-redesign / about-redesign spec）

---

## 8. proxy 层

`src/proxy.ts` 当前实现（Next 16 proxy）：

- ✅ 守 `/admin/*` 与 `/api/admin/*` 的认证
- ❌ **不**做任何 locale negotiation / redirect
- ❌ 不读 `Accept-Language` header
- ❌ 不设置 locale cookie

---

## 9. 测试覆盖

i18n 相关测试约束：

- `src/app/(site)/page.test.tsx:43` `mocks.getCurrentLocale.mockReturnValue("zh")` — 仅测 zh path
- `src/app/(site)/tags/page.test.tsx:22` 同上
- `src/app/(site)/posts/[slug]/page.test.tsx:68` 同上
- `src/app/(site)/tags/[slug]/page.test.tsx:35` 同上
- `src/app/sitemap.test.ts:107` `excludes columns without DEFAULT_LOCALE translation` — 边界 case 测了但只测 zh fallback

**事实**：

- 无 locale switching 测试
- 无 fallback 链测试（zh → en → 第一个 translation）
- 无 metadata alternates 测试
- 无 PostEditor 多 locale 编辑测试（因为根本没有 UI）

---

## 10. memory-bank / SDD 中的相关记录

- ✅ `memory-bank/knownIssues.md:31-37` KI-004 总结准确
- ✅ `memory-bank/systemPatterns.md:84-109` §7 i18n 数据模型约定完整
- ✅ `memory-bank/progress.md:172-176` V3 backlog 描述准确
- ⚠️ `.claude/sdd/public-launch-polish/specs/i18n-roadmap/spec.md` 记录了 roadmap scenarios，但 spec 内容**已落地的是文档**（不是实际多语言能力）
- ⚠️ `README.md` / `docs/` 中部分文案暗示 "支持多语言"（schema 层意义上正确，但读者会误解为已上线多语言）

---

## 11. 五分类标记总表

按 `i18n-current-state-audit` spec I18N-S1 要求，把每条"看起来 i18n"的能力按以下五分类标记：

- `placeholder`：完全不存在功能（如 `app/[lang]` 路由）
- `schema-only`：DB / 类型系统已就位，运行时未启用
- `hardcoded-zh`：硬编码中文输出
- `hardcoded-en`：硬编码英文输出
- `mixed`：同一页面中英文混乱

| 能力 | 分类 | 证据 |
|---|---|---|
| `app/[lang]` 路由 | placeholder | 无对应文件 |
| proxy locale negotiation | placeholder | `src/proxy.ts` 无 |
| `getCurrentLocale()` 动态实现 | placeholder | `src/lib/i18n.ts:6-7` 硬编码 |
| dictionary / messages 系统 | placeholder | 无文件 |
| next-intl | placeholder | 不依赖 |
| `PostTranslation` 表 | schema-only | `prisma/schema.prisma:113-124` |
| `ColumnTranslation` 表 | schema-only | `prisma/schema.prisma:68-78` |
| `listPosts(filter, locale)` 服务签名 | schema-only | `src/lib/services/posts.ts:78` |
| `listColumnsForLocale(locale)` 服务签名 | schema-only | `src/lib/services/columns.ts:49` |
| `listAllTagsWithCount(locale)` 服务签名 | schema-only（fake；locale 参数 ignored） | `src/lib/services/tags-public.ts:19-20` |
| RootLayout `<html lang="zh-CN">` | hardcoded-zh | `src/app/layout.tsx` |
| RootLayout `openGraph.locale: "zh_CN"` | hardcoded-zh | `src/app/layout.tsx:42` |
| `app/sitemap.ts` | hardcoded-zh | `DEFAULT_LOCALE` |
| `app/rss.xml/route.ts` | hardcoded-zh | `DEFAULT_LOCALE` |
| `opengraph-image.tsx` 文案 | hardcoded-en | 硬编码 "NOTES FROM THE FIELD" |
| `opengraph-image.tsx` translation fallback | hardcoded-zh | `DEFAULT_LOCALE` fallback |
| `PostEditor.tsx:55,122` | hardcoded-zh | runtime `locale: "zh"` |
| `ColumnFormDialog.tsx:89,151` | hardcoded-zh | runtime `locale: "zh"` |
| `ColumnsTable.tsx:78,167` | hardcoded-zh | runtime `locale: "zh"` |
| `SiteHeader.tsx` nav | hardcoded-en | "Blog/Columns/About" |
| `SiteFooter.tsx` | mixed | "© 2026 HaiDen" + 其他中文 |
| 首页 "所有文章" + "View all" | mixed | `page.tsx:34, 37` 中英文混在 4 行内 |
| 详情页 "← 所有文章" + "views/comments" | mixed | `posts/[slug]/page.tsx:81 vs 115-117` |
| About 内容 (`content/about.ts`) | hardcoded-zh | 单 object |
| AlertDialog / Form label / Toast | hardcoded-zh | admin/* 各组件 |

---

## 12. V3 独立 SDD 准入条件

V3 SDD（slug 建议：`i18n-locale-routing-v3`）应在以下条件全部满足后才进入实施：

### 12.1 业务前提

- [ ] 有真实英文内容来源（至少 5 篇 en 翻译 ready；不能只有 zh 译 en 占位）
- [ ] 决定 i18n 默认行为：默认 zh / 默认按 `Accept-Language` 协商 / 默认 en？
- [ ] 决定 URL 风格：`/posts/foo` (zh root) + `/en/posts/foo` (en) 还是 `/zh/posts/foo` + `/en/posts/foo`（zh 也带前缀）？
- [ ] 决定如何处理标签：tag 单语保留 / TagTranslation 加 / 标签强制英文 slug？

### 12.2 技术决策

- [ ] 路由树形态：`app/[lang]/(site)/...` 全树迁移 vs proxy-rewrite 单树？
- [ ] dictionary 形态：static JSON / next-intl / 自研 type-safe key？
- [ ] OG image：每 locale 一张？字体能否兼容中英？
- [ ] proxy negotiation：解析 cookie `NEXT_LOCALE` + `Accept-Language` fallback + bot detection？

### 12.3 SEO / feed

- [ ] `<html lang>` 改成 per-page 动态
- [ ] `generateMetadata.alternates.languages` 接齐
- [ ] sitemap 加 `<xhtml:link rel="alternate">`
- [ ] RSS 每 locale 一份（如 `/rss.xml`, `/en/rss.xml`）
- [ ] canonical link 在 each locale 设置正确

### 12.4 admin 编辑

- [ ] 后台加 locale switch UI（Tab / Select），切换时切换编辑的 `*Translation` 子表 row
- [ ] 创建文章时是否要求强制写 zh + en 双语？还是允许 partial？
- [ ] 列表页能否按 "lacks en translation" 筛选？

### 12.5 测试 / 验收

- [ ] `getCurrentLocale()` 动态实现的单元测试（cookie 优先 / header fallback / default）
- [ ] 路由 fallback：访问 en 不存在的文章时是否 redirect 到 zh / 404？
- [ ] sitemap / RSS 多 locale 输出测试
- [ ] OG image 多 locale 测试
- [ ] e2e（如时机成熟）：浏览器切换 locale → 内容、metadata、OG 全 reload 一致

### 12.6 不变量保留

- [ ] schema 不变（不能改 `PostTranslation` 字段名 / unique constraint）
- [ ] zh 现有内容 URL 不变（避免 SEO 损失）
- [ ] proxy 上 admin / api 守卫不动

---

## 13. 本轮（public-ui-and-editor-overhaul）刻意不做的

按 `proposal.md §3` 明确：

- ❌ 不做 `app/[lang]` 路由
- ❌ 不改 `getCurrentLocale()`
- ❌ 不引入 next-intl
- ❌ 不做 metadata alternates / sitemap hreflang / RSS multi-feed
- ❌ 不做 OG 多 locale
- ❌ 不做 admin locale switch UI

**本轮要做的**（落到 `specs/i18n-current-state-audit/spec.md`）：

- ✅ 本审计文档作为交付物归档
- ✅ About 页加显式声明 "TZBlog 当前是中文单语言站点；多语言能力在数据层预留，将在 V3 单独 SDD 中实施"
- ✅ README 同步说明
- ✅ sitemap robots.txt 等不需要"假装多语言"的元数据保持单 locale 干净输出
- ✅ Header / Footer / 首页 / 详情页的 chrome 文案**一致化**（决策：统一中文，删除"View all"等英文 chrome；详见 home-redesign spec）

---

## 14. 风险与误用

- **风险 1**：如果 V3 实施前有访客通过 `Accept-Language: en` 访问 TZBlog，看到的仍是中文站点。**不允许**用 useragent sniff 来"猜测" en 给假英文 fallback；保持 honest zh。
- **风险 2**：将来 V3 改 URL 结构（如 `/posts/foo` → `/zh/posts/foo`），现有外链 + RSS 订阅可能失效。V3 SDD 必须有 301 redirect 表。
- **风险 3**：当前 Tag 模型无 translation。如果 V3 给 Tag 加翻译，需 schema migration + 全量回填默认翻译。
- **风险 4**：当前 `<html lang="zh-CN">` 写在 RootLayout 而不是 layout level，如果想 per-page 切换，要重构 layout tree。

---

## 15. 一句话状态声明（写到 About / README）

```
TZBlog 目前是一个中文单语言（zh-CN）个人技术博客。
数据模型预留了多语言能力，但当前 UI、SEO、RSS、sitemap、后台编辑均未启用多语言路径。
英文翻译能力的完整实施将在 V3 独立 SDD 中进行（slug: i18n-locale-routing-v3）。
```

执行方在实施 `home-redesign` / `about-redesign` 时把这段话用合适的语气植入到 About 页和 README。

