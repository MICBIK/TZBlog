## ADDED Requirements

> Spec IDs: **SPEC-E-3**, **SPEC-E-4**, **SPEC-E-5**
>
> Implementation: `src/app/rss.xml/route.ts` (Route Handler GET)
> Tests: `src/app/rss.xml/route.test.ts`（unit，mock `listPosts`）

### Requirement: RSS feed 返回 application/rss+xml 含 channel + items [SPEC-E-3]

`GET /rss.xml` SHALL 返回 RSS 2.0 标准的 XML 文档，`Content-Type: application/rss+xml`（charset 可选 utf-8）。文档结构 MUST：

1. 起始 XML 声明：`<?xml version="1.0" encoding="UTF-8"?>`
2. 根节点 `<rss version="2.0">`，子节点 `<channel>`
3. channel 内含 `<title>` `<link>` `<description>` 三件套，分别取自 `SITE_META.{name, baseUrl, description}`
4. 每个 PUBLISHED post 对应一个 `<item>`，含 `<title>` / `<link>` / `<guid isPermaLink="true">` / `<pubDate>` / `<description>` 五个字段
5. `<link>` 与 `<guid>` 均为 `absoluteUrl("/posts/<slug>")`
6. `<pubDate>` 取 `post.publishedAt ?? post.updatedAt`，格式化为 RFC 822（用 `Date.toUTCString()`）
7. `<description>` 取 `post.excerpt`（null 时为空字符串）

#### Scenario: RSS XML 结构与字段映射
- **GIVEN** 两条 PUBLISHED post：`first`（title=`First Post`, excerpt=`First excerpt`, publishedAt=`2026-05-21T00:00:00Z`）、`second`（title=`Second Post`, publishedAt=`2026-05-20T00:00:00Z`）
- **WHEN** 请求 `GET /rss.xml`
- **THEN** 响应 `Content-Type` 含 `application/rss+xml`
- **AND** body 以 `<?xml version="1.0" encoding="UTF-8"?>` 起始
- **AND** body 含 `<rss version="2.0">`、`<channel>`、`<title>TZBlog</title>`、`<link>${baseUrl}</link>`
- **AND** body 含 `<item>` 两条
- **AND** 每条 item 含对应的 `<title>` / `<link>${baseUrl}/posts/<slug></link>` / `<guid isPermaLink="true">${baseUrl}/posts/<slug></guid>` / `<pubDate>${publishedAt.toUTCString()}</pubDate>` / `<description>...</description>`

### Requirement: RSS feed 最多 20 条，publishedAt 降序 [SPEC-E-4]

RSS feed MUST 最多包含 20 个 `<item>`。调用 `listPosts` 时 SHALL 传 `{ page: 1, pageSize: 20, status: "PUBLISHED" }` + `DEFAULT_LOCALE`；listPosts 服务对 `status === "PUBLISHED"` 按 `publishedAt desc nulls last` 排序（见 `src/lib/services/posts.ts:102-104`），最新发布的文章排在最前。

#### Scenario: 25 条文章中只取最新 20 条
- **GIVEN** 25 条 PUBLISHED post，listPosts mock 返回 items 数组（按时间序，`Post 1` 最新、`Post 25` 最旧）
- **WHEN** 请求 `GET /rss.xml`
- **THEN** listPosts mock 被调用一次，参数为 `{ page: 1, pageSize: 20, status: "PUBLISHED" }` + `"zh"`
- **AND** body 中 `<item>` 数量为 20
- **AND** body 含 `<title>Post 1</title>`、`<title>Post 20</title>`
- **AND** body 不含 `<title>Post 21</title>`

### Requirement: RSS feed 转义 XML 安全字符 [SPEC-E-5]

post 的 `title` 与 `excerpt` 中的 XML 保留字符 MUST 在写入 `<title>` / `<description>` 前转义为 XML 实体：
- `&` → `&amp;`
- `<` → `&lt;`
- `>` → `&gt;`
- `"` → `&quot;`
- `'` → `&apos;`

转义顺序 MUST 先处理 `&`（其他实体本身含 `&`），且要全字段替换（`replaceAll` 而非 `replace`）。

#### Scenario: 转义 5 类预定义实体
- **GIVEN** 一条 PUBLISHED post：title=`Tips & tricks <hello>`、excerpt=`Use "quoted" & 'single' > done`
- **WHEN** 请求 `GET /rss.xml`
- **THEN** body 含 `<title>Tips &amp; tricks &lt;hello&gt;</title>`
- **AND** body 含 `<description>Use &quot;quoted&quot; &amp; &apos;single&apos; &gt; done</description>`
- **AND** body **不含** 裸的 `<hello>`
- **AND** body 中所有 `&` 都跟 `amp;` / `lt;` / `gt;` / `quot;` / `apos;`（用正则 `/&(?!amp;|lt;|gt;|quot;|apos;)/` 断言无裸 `&`）

## Open Issues

- **M3 (审计 follow-up)**：RSS Route Handler 无 `revalidate` / Cache-Control，每次请求都打 DB。修复方案见 `tasks.md §F.3`。
- **M4 (审计 follow-up)**：未输出 `<atom:link rel="self">` 与 `<lastBuildDate>`，W3C feed validator 会标记。修复方案见 `tasks.md §F.4`。
- **L1 (审计 follow-up)**：`route.ts:11` `posts.items.slice(0, 20)` 冗余（已传 `pageSize: 20`），可删。
