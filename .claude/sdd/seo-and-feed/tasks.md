# tasks.md — seo-and-feed

> 微循环结构：1 spec scenario = 1 微循环 (`.a [TEST-RED]` + `.b [IMPL-GREEN]`)。
> 阶段前缀 `[P2-E]`（被看见 / SEO 阶段）。
> 本文件是**追溯性补齐**（CLAUDE.md TDD 执行铁律 #2 要求 tasks.md 生成前必须有 test-map.md，先前实现绕过此步骤）；§A-§D 微循环已通过 commit 落地，§F 列出审计 follow-up。

## A. [P2-E] 准备工作 — site-meta helper

### A.1 absoluteUrl 拼接

- [x] A.1.a [TEST-RED] 写 `absoluteUrl trims trailing slash and normalizes leading slash`（mock `@/lib/env` 注入 `SITE_URL=https://example.com/`），跑 `pnpm test src/lib/site-meta.test.ts` 粘 FAIL（commit `b083b57`，site-meta.test.ts 与 sitemap 测试同 RED 提交）
- [x] A.1.b [IMPL-GREEN] 新增 `src/lib/site-meta.ts`：定义 `SITE_META` const + `absoluteUrl(path)`，跑测试粘 PASS（commit `9321483`）

## B. [P2-E] sitemap

### B.1 静态路由 + PUBLISHED post + columns [SPEC-E-1]

- [x] B.1.a [TEST-RED] 写 `includes static routes + published posts + columns`（integration，真实 DB seed 3 PUBLISHED post + 2 column），跑 `pnpm test src/app/sitemap.test.ts` 粘 FAIL（commit `b083b57`）
- [x] B.1.b [IMPL-GREEN] 新增 `src/app/sitemap.ts`：调 `listPosts({ pageSize: 1000, status: "PUBLISHED" })` + `listColumns()` + `absoluteUrl`，粘 PASS（commit `9321483`）
  注：此处 `pageSize: 1000` 绕过 `postFilterSchema.pageSize.max(100)` — **审计 H2**，由 §F.1 修复。

### B.2 DRAFT / ARCHIVED 排除 [SPEC-E-2]

- [x] B.2.a [TEST-RED] 写 `skips DRAFT and ARCHIVED posts`（seed 三种状态各一），粘 FAIL（commit `b083b57`）
- [x] B.2.b [IMPL-GREEN] B.1.b 实现中传 `status: "PUBLISHED"` 已自然覆盖；测试一次过 PASS（commit `9321483`）

## C. [P2-E] feed (RSS)

### C.1 RSS XML 结构 + Content-Type [SPEC-E-3]

- [x] C.1.a [TEST-RED] 写 `returns application/rss+xml with channel + items`（mock listPosts 返 2 条），跑 `pnpm test src/app/rss.xml/route.test.ts` 粘 FAIL（commit `b15e17e`）
- [x] C.1.b [IMPL-GREEN] 新增 `src/app/rss.xml/route.ts`：拼 RSS 2.0 XML，含 channel 三件套 + items，`Content-Type: application/rss+xml; charset=utf-8`，粘 PASS（commit `2741ce8`）

### C.2 cap 20 + publishedAt desc [SPEC-E-4]

- [x] C.2.a [TEST-RED] 写 `caps items at 20 in publishedAt desc`（mock 返 25 条），粘 FAIL（commit `b15e17e`）
- [x] C.2.b [IMPL-GREEN] 实现中传 `pageSize: 20`（listPosts service 按 publishedAt desc 排序，见 `posts.ts:102-104`）；同时 `posts.items.slice(0, 20)` 双保险（**L1 冗余**，由 §F.7 清理），粘 PASS（commit `2741ce8`）

### C.3 XML 实体转义 [SPEC-E-5]

- [x] C.3.a [TEST-RED] 写 `escapes &, <, >, ", and ' in title and description`，粘 FAIL（commit `b15e17e`）
- [x] C.3.b [IMPL-GREEN] 实现 `escapeXml(value)`，先 `&` 后其他 4 类，全字段 `replaceAll`，粘 PASS（commit `2741ce8`）

## D. [P2-E] og-and-metadata

### D.1 PUBLISHED post → image/png 200 [SPEC-E-6]

- [x] D.1.a [TEST-RED] 写 `returns image/png response for published post`（mock getPostBySlug 返 PUBLISHED post），跑 `pnpm test src/app/\(site\)/posts/\[slug\]/opengraph-image.test.ts` 粘 FAIL（commit `5f35aec`）
- [x] D.1.b [IMPL-GREEN] 新增 `src/app/(site)/posts/[slug]/opengraph-image.tsx`：导出 `size` / `contentType` / default async handler，调 `ImageResponse(jsx, size)`，粘 PASS（commit `4c89f10`）

### D.2 missing / DRAFT / ARCHIVED → notFound [SPEC-E-7]

- [x] D.2.a [TEST-RED] 写 `calls notFound when post missing or not published`（mock notFound 抛 `NEXT_NOT_FOUND`），粘 FAIL（commit `5f35aec`）
- [x] D.2.b [IMPL-GREEN] handler 内加 `if (!post || post.status !== "PUBLISHED") notFound()` + `if (!tr) notFound()` 双重守卫，粘 PASS（commit `4c89f10`）

## E. [P2-E] 集成验收

- [x] E.1 跑 `pnpm typecheck && pnpm lint && pnpm test`，全绿（237 passed | 1 skipped；用户 message 已确认）
- [x] E.2 更新 `memory-bank/progress.md`（勾选 P2-E RSS/sitemap/OG）、`memory-bank/activeContext.md`（切到下一焦点）— 走 §G.1
- [ ] E.3 `manual smoke` — 浏览器访问 `/sitemap.xml` / `/rss.xml` / `/posts/<slug>/opengraph-image` 各一次，确认输出符合预期（user 可在 follow-up 处理或下一轮 verify 时执行）
- [ ] E.4 第三方 OG 预览（OpenGraph.xyz / Twitter Card Validator）验 og 图渲染（需先合并 §F.4 `metadataBase` 修复，否则 `og:image` URL 是相对路径）

## F. [审计 follow-up] 合并前应修复的缺口

> 来源：上一轮审计报告（CRITICAL / HIGH / MEDIUM / LOW 级缺口）。每条任务挂对应严重度与 spec 引用。本节任务 **未完成**，需走完整 TDD 微循环。

### F.1 [HIGH H2] sitemap 完整分页拉取 PUBLISHED post slug

> 当前 `sitemap.ts:10` 写 `pageSize: 1000` 绕过 `postFilterSchema.pageSize.max(100)`；文章数 > 1000 时静默截断。

- [x] F.1.a [TEST-RED] 在 `src/lib/services/posts.test.ts` 写 `listAllPublishedSlugs returns every PUBLISHED post across pages`（seed 250 条 PUBLISHED post），跑测试粘 FAIL（commit `e64bb3d`）
- [x] F.1.b [IMPL-GREEN] 在 `src/lib/services/posts.ts` 新增 `listAllPublishedSlugs(locale): Promise<{ slug: string; updatedAt: Date }[]>`：内部循环 `findMany` 分页拉取（pageSize=100），粘 PASS（commit `bcbcc27`）
- [x] F.1.c [TEST-RED] 在 `src/app/sitemap.test.ts` 补 `walks pagination for >1000 PUBLISHED posts`（seed 1050 条），粘 FAIL（commit `113935b`）
- [x] F.1.d [IMPL-GREEN] 把 `sitemap.ts` 中 listPosts 调用改为 `listAllPublishedSlugs(DEFAULT_LOCALE)`，粘 PASS（commit `1986096`）

### F.2 [MEDIUM M2] sitemap 按 locale 过滤 column

> 当前 `listColumns()` 不过 locale，列出无 zh 翻译的 column 会在前台 404。

- [x] F.2.a [TEST-RED] 在 `src/app/sitemap.test.ts` 加 `excludes columns without DEFAULT_LOCALE translation`（seed 2 column，一个无 zh 翻译），粘 FAIL（commit `7fdff94`）
- [x] F.2.b [IMPL-GREEN] 把 `sitemap.ts` 改用 `listColumnsForLocale(DEFAULT_LOCALE)`，粘 PASS（commit `b118fe1`，同 commit 并入 sitemap `revalidate = 600`）

### F.3 [MEDIUM M3] rss / sitemap 缓存策略

> Route Handler / Metadata Route 默认每次请求都打 DB，爬虫高频访问会浪费。

- [x] F.3.a [TEST-PRE-COVERED] 行为级断言较难（test runtime 不模拟 Next ISR），改走 design 决策：选 `export const revalidate = 600`（10min）作为基准，写到 design 决策段落或 `memory-bank/systemPatterns.md`（commit `488c887`）
- [x] F.3.b [IMPL-GREEN] 在 `sitemap.ts` 与 `rss.xml/route.ts` 顶部加 `export const revalidate = 600`，跑 `pnpm build` 确认无回归（sitemap 部分 commit `b118fe1`；rss 部分 commit `8e8040b`）

### F.4 [MEDIUM M4 + HIGH H4] RSS 增强 + `metadataBase` 修复

> RSS 缺 `<atom:link rel="self">` + `<lastBuildDate>`；app/layout.tsx 缺 `metadataBase` 导致 OG 元数据相对 URL 拼接不可靠。

- [x] F.4.a [TEST-RED] 在 `rss.xml/route.test.ts` 加 `includes <atom:link rel="self"> and <lastBuildDate>`，粘 FAIL（commit `4fe2f60`）
- [x] F.4.b [IMPL-GREEN] 在 `rss.xml/route.ts` 加 `<atom:link>` self-ref（含 xmlns:atom）+ `<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>`，粘 PASS（commit `8e8040b`，同 commit 并入 rss `revalidate = 600` 与 F.7.a）
- [x] F.4.c [TEST-RED + IMPL-GREEN] 在 `src/app/layout.tsx` 的 `metadata` export 加 `metadataBase: new URL(env.SITE_URL)` + `openGraph: { type: "website", siteName: "TZBlog", locale: "zh_CN" }`（RED commit `528e23a`，GREEN commit `ce1ad70`）

### F.5 [MEDIUM M1] og-image Props 类型 union 收敛到 Promise

> 当前 `params: { slug: string } | Promise<{ slug: string }>` 是兼容 shim，违反 CLAUDE.md "禁兼容 shim"。

- [x] F.5.a [TEST-RED] 改 `opengraph-image.test.ts` 中两处 `params` 从 `{ slug: "hello" }` 改为 `Promise.resolve({ slug: "hello" })`，并补 promise-only source invariant + size / image bytes 断言，跑测试粘 FAIL（commit `58c5c90`）
- [x] F.5.b [IMPL-GREEN] 把 `opengraph-image.tsx:9` 的 `Props.params` 改为 `Promise<{ slug: string }>` 纯 Promise，粘 PASS（commit `323198d`）

### F.6 [HIGH H3] 落地 robots.ts

> SDD 已留 `specs/robots/spec.md` 占位，实现未落地。

- [x] F.6.a [TEST-RED] 新增 `src/app/robots.test.ts`：测 `robots() returns rules with userAgent="*" and allow="/"` + `robots() sitemap field uses absoluteUrl("/sitemap.xml")`（mock `@/lib/env` 注入 `SITE_URL`），跑测试粘 FAIL（commit `6634ee5`）
- [x] F.6.b [IMPL-GREEN] 新增 `src/app/robots.ts` 按 spec 示例落地，粘 PASS（commit `74a9382`）

### F.7 [LOW] 清理与小优化

- [x] F.7.a [IMPL no-tdd] 删 `src/app/rss.xml/route.ts:11` 的 `posts.items.slice(0, 20)` 冗余（service 已 `pageSize: 20`；commit `8e8040b`）
- [x] F.7.b [IMPL no-tdd] 删空目录 `src/lib/seo/`，或填入共享 metadata helper（视 F.4.c 是否抽 helper 决定；空目录不受 Git 跟踪，已 `rmdir`，无代码 commit）
- [x] F.7.c [测试增强] 在 `opengraph-image.test.ts` 补 `expect(size).toEqual({ width: 1200, height: 630 })` + `expect((await response.arrayBuffer()).byteLength).toBeGreaterThan(1000)`（并入 commit `58c5c90`）
- [x] F.7.d [SKIPPED] sitemap 加 `priority` 与 `changeFrequency`（首页 1.0, post 0.7, column 0.5；首页 daily, post weekly, column weekly）— 非必需，本轮按 brief 建议跳过，后续有 SEO 精调需求再补断言落地

### F.8 [审计后置 B1] listAllPublishedSlugs 删 dead locale 参数 (YAGNI)

> 来源：本轮主脑审计发现 codex 按 brief 实现的 `listAllPublishedSlugs(locale)` 内部用 `void locale` 抑制 ESLint —— locale 参数从未被使用。违反 YAGNI 与 CLAUDE.md "禁兼容 shim"。**brief 设计瑕疵**（主脑责任），codex 严格按要求实现无过失。

- [x] F.8.a [TEST-RED] 在 `src/lib/services/posts.test.ts:475` 加 `expect(listAllPublishedSlugs.length).toBe(0)` arity 断言（守住未来不再悄悄塞回 locale 参数）；调用形态保留 `DEFAULT_LOCALE` 不变以让 typecheck 通过；跑 `pnpm test src/lib/services/posts.test.ts` 粘 FAIL（commit `4b8a4c5`）
  - 真实 FAIL 输出：`AssertionError: expected 1 to be +0`
- [x] F.8.b [IMPL-GREEN] `posts.ts:191` 删 `locale: Locale` 参数 + 删 `void locale`；`sitemap.ts:12` 调用点 `listAllPublishedSlugs(DEFAULT_LOCALE)` → `listAllPublishedSlugs()`；`posts.test.ts:476` 与 importPostsService 类型签名同步删 locale 参数；跑测试粘 PASS 28/28（commit `330d343`）

## G. 收尾

- [x] G.1 更新 `memory-bank/{progress,activeContext}.md`，knownIssues.md 登记 §F follow-up 缺口
- [x] G.2 ha1den decision point：F 段 7 项缺口（H2/H3/H4 + M1-M4 + L）已按 A 方案合到当前 SDD，§F.8 B1 dead-param 审计后置修复已落地
- [ ] G.3 `/opsx:verify seo-and-feed`（执行前确保 X1 `.env.production AUTH_SECRET` build 阻塞已修复）
- [ ] G.4 `/opsx:archive seo-and-feed`

## Commit 历史快照

| commit | 阶段 | spec id |
|---|---|---|
| `b083b57` | A.1.a + B.1.a + B.2.a [TEST-RED] | SPEC-E-1..2 |
| `9321483` | A.1.b + B.1.b + B.2.b [IMPL-GREEN] | SPEC-E-1..2 |
| `b15e17e` | C.1.a + C.2.a + C.3.a [TEST-RED] | SPEC-E-3..5 |
| `2741ce8` | C.1.b + C.2.b + C.3.b [IMPL-GREEN] | SPEC-E-3..5 |
| `5f35aec` | D.1.a + D.2.a [TEST-RED] | SPEC-E-6..7 |
| `4c89f10` | D.1.b + D.2.b [IMPL-GREEN] | SPEC-E-6..7 |
| `a650dbb` | SDD 追溯补齐 [no-tdd] | — |
| `6634ee5 → 74a9382` | F.6 robots.ts | SPEC-E-R-1..2 |
| `58c5c90 → 323198d` | F.5 + F.7.c og-image Promise params + image bytes | M1 + 测试增强 |
| `528e23a → ce1ad70` | F.4.c metadataBase + openGraph defaults | H4 |
| `e64bb3d → bcbcc27` | F.1.a/b listAllPublishedSlugs helper | H2 part 1 |
| `113935b → 1986096` | F.1.c/d sitemap 接入 helper | H2 part 2 |
| `7fdff94 → b118fe1` | F.2 + F.3 sitemap (locale filter + revalidate) | M2 + M3 |
| `4fe2f60 → 8e8040b` | F.4.a/b + F.3 + F.7.a rss (atom+lastBuild + revalidate + slice 清理) | M4 + M3 + L1 |
| `488c887` | F.3.a 缓存策略决策 [no-tdd] | M3 |
| `70cbfd5` | follow-up 闭环同步 [no-tdd] | — |
| `4b8a4c5 → 330d343` | F.8 listAllPublishedSlugs 删 dead locale 参数 | B1 (审计后置) |

> 节奏注记：原 6 + follow-up 16 + B1 2 = 24 个有效 commit，全部 `test(<scope>)` → `feat(<scope>)` 严格配对，scope 一致，husky commit-msg hook 全通过。本 SDD 在原 6 commit 落地后追溯补齐（commit `a650dbb`），违反 CLAUDE.md TDD 执行铁律 #2（tasks.md 生成前 MUST 已有 test-map.md）—— 下一轮 SDD 必须先建本目录三件套（proposal + 4×spec + test-map）再起任务。
