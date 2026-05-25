# design-notes: blog-ia-redesign

> 关键设计决策记录。`proposal.md` 定义范围，本文回答 Open Questions 并记录架构决策。
>
> 所有"倾向"答案是默认推进方向，HaiDen review 时可推翻。

---

## Open Questions 答案（Default Inclination）

### Q1: Tag 模型是否升级？
答：**不升级**。

理由：标签是通用分类工具，无 Channel 强归属。Tag 表保持现状，把 `TagsOnPosts` 改名为 `TagsOnEntries`（postId → entryId）。如果未来 Channel 需要专属过滤，加 `ChannelTag(channelId, tagId)` m2m 即可，不破坏 Tag 模型。

### Q2: 编辑器图片上传走哪？
答：**用现有 `/api/media/upload` endpoint**。

理由：已 MinIO 接入、已 Auth 守、已 Media 表索引。Milkdown 的 upload plugin 通过 prop 注入 `onUpload` callback，回调内部走 `fetch('/api/media/upload')`。

增强：拖拽 / 粘贴图片自动触发上传，loading 状态用 placeholder，失败回滚。

### Q3: 三套字体加载方式
答：**每个 layout 独立 `next/font`**，避免每页加载全部字体。

- `src/app/(site)/layout.tsx` → `Inter Variable` + `Cormorant Garamond`（Aurora 皮）
- `src/app/(site)/posts/[slug]/layout.tsx` → `Noto Serif SC` + `Cormorant Garamond`（Ink 皮，保留 display 字体作 cross-pollination）
- `src/app/(site)/c/[slug]/layout.tsx` → 根据 channel.kind/layout 决定加载哪些字体（动态 server-side 判断）

详细 import 模式见 `research/theme-token-strategy.md` §5。

### Q4: 首页 Channel 顺序
答：**`Channel.order Int` 字段** + 后台 UI 上下移动按钮，不做拖拽。

理由：YAGNI 单作者，拖拽是为了多操作员场景。后台列表按 `order ASC` 排序，每行有 `↑↓` 按钮触发 order swap server action。

### Q5: Magic link 邮件语言
答：**中文**（内容主语言）。

模板用 React Email + Resend 发送：
- Subject: `登录 TZBlog`
- HTML + Plain text 双版本
- 15 分钟有效（Auth.js 默认 24h，改短）
- 一键登录按钮 + 忽略说明
- Footer: 不接收邮件请联系 admin

模板路径：`src/lib/email/templates/magicLink.tsx`。

### Q6: Channel 是否软删除？
答：**硬删除**（开发期）。生产期改 `enabled` flag 做 soft toggle。

理由：开发期可破坏数据。生产期防误删用 confirm dialog + 30 天 trash 表，但本次重构只做硬删除 + enabled flag toggle，trash 推到 V2。

### Q7: Guestbook thread 结构
答：**不做嵌套 thread 树**，扁平 conversation。

设计：
- 1 visitor（已登录）→ 创建 1 个 `GUESTBOOK_THREAD` Entry（Entry.kind 区分），body = 初始留言
- admin 后台看到所有 thread → 回复 = `Comment` with `entryId=thread.id`, `parentId=null`, `visibility=PRIVATE_TO_THREAD`
- visitor 续言同样是 `Comment` with `parentId=null`
- 不做嵌套 reply（comment.parentId 字段在 GUESTBOOK 场景永远 null）
- `Comment.visibility` 三态：`PUBLIC`（保留作未来普通文章评论）/ `PRIVATE_TO_THREAD`（thread owner + admin 可见）/ `DELETED`

### Q8: 首页 Hero 文案 / 头像
答：**先用 placeholder bio**。HaiDen 后续在 `SiteConfig.metadata.hero` 替换。

```json
{
  "hero": {
    "tagline": "在快的时代写慢一些的字",
    "subtitle": "工程师 / 安全研究 / 慢博客作者",
    "avatar": "/showcase/avatar.jpg",
    "location": "杭州"
  }
}
```

admin 后台 `/admin/settings/site` 页面可视化编辑这些字段（form 直接 update SiteConfig）。

### Q9: Sitemap V2
答：**做**。

理由：URL 结构全变（`/c/[slug]/[entry-slug]` + 保留 `/posts/[slug]` for ARTICLE），sitemap 必须重生成。

任务：
- `src/app/sitemap.xml/route.ts` 改为遍历所有 enabled Channel 的所有 published Entry
- 为 ARTICLE kind 输出 `/posts/<slug>` URL
- 为其他 kind 输出 `/c/<channel-slug>/<entry-slug>` URL
- RSS 同步更新

### Q10: Channel.theme 字段是否暴露给 admin？
答：**不暴露**。

理由：路由级硬映射决策已锁。Channel.theme 字段干脆**不存在**，theme 由 routing + channel.kind/layout 推论（详见 A4）。

### Q11: 5/24 已通过 Gate B 的 BlockNote 集成（`.claude/sdd/notion-block-editor/`）如何处置？
答：**SUPERSEDE + 归档**（ha1den 2026-05-25 决策）。

详情：
- `.claude/sdd/notion-block-editor/` → `.claude/sdd/archive/2026-05-25-notion-block-editor/`，加 `SUPERSEDED.md` footer link 到本 SDD
- 现有代码进 cleanup checklist（详见 specs/16-cleanup）：
  - `src/components/editor/NotionBlockEditor.tsx` / `.test.tsx`
  - `src/components/editor/markdownBridge.ts` / `.test.tsx`
  - `src/components/editor/notionEditorAdapter.ts` / `.test.ts`
  - `src/components/editor/predecessorRemoval.test.ts`
  - `src/components/editor/MarkdownEditor.tsx` / `.test.tsx`
  - `src/components/editor/MarkdownEditorWithPreview.tsx` / `.test.tsx`
  - `src/components/editor/MarkdownPreview.tsx` / `.test.tsx`
  - `src/components/editor/EditorToolbar.tsx` / `.test.tsx`
  - `src/components/editor/__fixtures__/` 全部（POC 时期遗留）
  - `package.json` / `pnpm-lock.yaml`：删 `@blocknote/core` `@blocknote/react` `@blocknote/shadcn`，删 CodeMirror 6 包（`@codemirror/*` + `codemirror`）
- BlockNote SDD 的两件遗产**保留进新 SDD**：
  - `poc/sample.md` fixture 完整复制到 `src/components/editor/__fixtures__/round-trip/mixed.md`（Milkdown POC P0 fixture）
  - `test-map.md` round-trip 方法论复制到 `editor-comparison.md` §4（Milkdown POC 验收清单）

---

## 关键架构决策

### A1: Entry kind 与 Channel kind 的关系

Channel.kind 决定 admin 创建 Entry 时可选的 Entry.kind：

| Channel kind | 允许的 Entry kind |
|---|---|
| `ARTICLES` | `ARTICLE` |
| `NOTES` | `NOTE`, `QUOTE`, `LINK` |
| `LINKS` | `LINK` |
| `STREAM` | `NOTE`, `JOKE`, `HOT_TAKE`, `QUOTE`, `LINK`, `REVIEW` |
| `GUESTBOOK` | `GUESTBOOK_THREAD`（由系统自动创建，admin 不手动） |
| `CUSTOM` | 任意（兜底，慎用） |

admin 后台创建 Entry 时根据 Channel.kind 联动 dropdown。

### A2: Layout 与 Channel kind 的兼容矩阵

| Channel kind | 兼容 layout |
|---|---|
| `ARTICLES` | `CHRONICLE` (默认), `CARDS` |
| `NOTES` | `TIMELINE` (默认), `FEED` |
| `LINKS` | `GREP` (默认), `CARDS` |
| `STREAM` | `TIMELINE` (默认), `FEED`, `GREP` |
| `GUESTBOOK` | 固定 `GUESTBOOK_PRIVATE`（特殊 layout，不算公开 5 个 layout 之内） |
| `CUSTOM` | 任意 5 个 |

admin 后台创建 Channel 时，选 kind → 联动 layout dropdown 只显示兼容项。

### A3: URL 结构详细规则

| URL | 含义 | 主题 |
|-----|------|------|
| `/` | 首页（动态读 enabled Channel.order 渲染各 Channel preview block） | Aurora |
| `/c/<channel-slug>` | Channel 详情（按 channel.layout 渲染所有 published Entry） | 由 channel 推论 |
| `/c/<channel-slug>/<entry-slug>` | 通用 Entry 详情（任何 kind） | 跟随父 Channel |
| `/posts/<entry-slug>` | ARTICLE kind 的 SEO 友好 URL（仅 `kind=ARTICLE` 生效，其他 kind 404） | Ink |
| `/c/<channel-slug>/series/<series-slug>` | Series 详情（系列首页 + 顺序 Entry list） | 跟随父 Channel |
| `/guestbook` | Guestbook 入口（登录后看自己的 thread；admin 看所有） | Aurora |
| `/tags/<tag-slug>` | Tag 详情（across Channel 聚合，按 Channel 分段显示） | Aurora |
| `/about` | About 页（`SiteConfig.metadata.about` 内容渲染） | Aurora |
| `/login` | 登录页（admin Credentials 表单 + 访客 magic link 表单二合一） | Aurora |
| `/admin/*` | 后台（不在三皮范围，独立 admin theme） | Admin |

`/posts/[slug]` 的实现：内部查 `Entry where kind=ARTICLE and slug=slug`，渲染 ARTICLE 详情。该 URL 作为兼容/SEO 友好的别名。

### A4: 三主题路由级硬映射

| 路由模式 | 主题 | `data-theme` |
|------|------|------|
| `/` | aurora | `aurora` |
| `/about` / `/guestbook` / `/login` | aurora | `aurora` |
| `/posts/[slug]` | ink | `ink` |
| `/c/[slug]` (kind ∈ {`ARTICLES`, `NOTES`} ∧ layout ∈ {`CHRONICLE`, `CARDS`}) | aurora | `aurora` |
| `/c/[slug]` (kind=`STREAM` ∨ layout ∈ {`GREP`, `TIMELINE`, `FEED`}) | terminal | `terminal` |
| `/c/[slug]/[entry-slug]` (kind=`ARTICLE`) | ink | `ink` |
| `/c/[slug]/[entry-slug]` (其他 kind) | 跟随父 Channel | (动态) |
| `/tags/[slug]` | aurora | `aurora` |
| `/admin/*` | admin (独立) | `admin` |

实现：每个 layout.tsx / page.tsx 用 Server Component 计算主题后，给最近的 wrapper element 加 `data-theme="..."`。layout 嵌套时子覆盖父。

### A5: Markdown round-trip parity test

固定 fixture 文件清单（5-8 个）：

| # | 文件 | 覆盖 |
|---|------|------|
| 1 | `fixtures/round-trip/basic.md` | 标题（h1-h6）+ 段落 + emphasize + link |
| 2 | `fixtures/round-trip/list.md` | 有序/无序列表（嵌套）+ task list (GFM) |
| 3 | `fixtures/round-trip/code.md` | 代码块（带语言、文件名注释）+ inline code |
| 4 | `fixtures/round-trip/table.md` | 表格（含对齐）+ 单元格内 emphasize |
| 5 | `fixtures/round-trip/alert.md` | GitHub-style alert (note/tip/important/warning/caution) |
| 6 | `fixtures/round-trip/image-link.md` | 图片（带 alt）+ inline link + auto link |
| 7 | `fixtures/round-trip/blockquote.md` | 引用（含嵌套）+ footnote |
| 8 | `fixtures/round-trip/mixed.md` | 上述全混合 |

测试函数（在 `src/components/admin/editor/__tests__/roundTrip.test.ts`）：

```typescript
import fixtures from './__fixtures__/round-trip'
import { markdownToEditorState, editorStateToMarkdown } from '../milkdown/io'

describe('Milkdown Markdown round-trip parity', () => {
  test.each(fixtures)('preserves $name', async ({ source }) => {
    const editorState = await markdownToEditorState(source)
    const exported = await editorStateToMarkdown(editorState)
    expect(exported.trim()).toBe(source.trim())
  })
})
```

判定：所有 8 个 fixture 必须 100% pass。违反任一项 → 编辑器集成不通过。

### A6: 数据迁移策略

开发期 vs 生产期：

- **开发期（本次）**：drop 所有旧表 + reseed showcase（不保留任何用户/文章数据，URL 全部废）
- **生产期**：不适用（项目未上线，无生产数据）

实施步骤详见 `migration-plan.md`。

### A7: 旧代码清理范围

完成本次重构后，以下关键字 grep src/ + prisma/schema.prisma 应 **0 命中**（archived `.claude/sdd/` 文档除外）：

- `model Post `, `model Column `, `model PostTranslation `, `model ColumnTranslation `, `model TagsOnPosts `
- `HomeGarden`, `HomeHero`, `HomeFeaturedAndRecent`, `HomeColumns`, `HomePrinciples`
- `PostEditor`, `NotionMarkdownEditor`, `NotionBlockEditor`
- `MarkdownEditorWithPreview`, `CodeMirrorEditor`（如果不再用）
- `listPosts`, `getPostBySlug`（除非保留为 Entry where kind=ARTICLE 适配器）
- `Post.findMany`, `Column.findMany`（除非迁移工具内部）

详细清单见 `specs/16-cleanup/clean-up-checklist.md`。

### A8: Channel 的"特殊" 类型

GUESTBOOK 是 Channel 但行为特殊：
- 一个站点固定一个 `kind=GUESTBOOK` 的 Channel（slug=`guestbook`，seed 创建）
- admin 不能在后台创建新的 GUESTBOOK channel
- 不在首页渲染（即使 enabled=true）
- 独立路由 `/guestbook` 处理
- Entry 由系统自动创建（visitor 第一次留言时）

CUSTOM 类型作为开发期兜底，admin 应避免使用，文档明确警告。

### A9: SiteConfig 扩展

`SiteConfig.metadata` 字段扩展（JSON）：

```typescript
type SiteConfigMetadata = {
  hero: {
    tagline: string
    subtitle: string
    avatar: string  // URL
    location?: string
  }
  about: {
    body: string  // Markdown
    contact: {
      email?: string
      qq?: string
      wechat?: string
      github?: string
    }
  }
  trending: {
    weights: { view: number; like: number; comment: number }
    halfLifeDays: number
    recomputeIntervalHours: number
  }
  brand: {
    title: string  // "TZBlog"
    domain: string  // "blog.haiden.dev"
    description: string  // SEO
  }
}
```

后台 `/admin/settings/site` 页面 form 编辑，存入 SiteConfig 单例。

### A10: Markdown 渲染管道修改

现有 `src/lib/markdown.ts` 的 `renderMarkdown` 保持，但 Entry 增加 kind 时可能需要 per-kind 渲染装饰：

- `ARTICLE`: 走完整 pipeline（含 TOC、Shiki、alert、image frame）
- `NOTE`: 同 ARTICLE 但不输出 TOC
- `LINK`: 只渲染 metadata.sourceUrl 的卡片，body 是可选摘要
- `JOKE`: 简单 prose 渲染
- `HOT_TAKE`: 显示 source + body
- `REVIEW`: 显示 rating + body + external link

实现：`src/lib/services/entryRender.ts` 按 kind 调用合适的 wrapper component，body 内 Markdown 仍走 `renderMarkdown`。

### A11: BlockNote → Milkdown 切换路径（参考 D15 + Q11）

- M2 (Admin CMS + Editor) 内嵌一个 Milkdown POC sub-gate（参考 `editor-comparison.md` §4 验收）：
  - **Milkdown Gate B**：用 `sample.md` 跑 Milkdown round-trip → 比对 `renderMarkdown` HTML parity（accept 同 BlockNote 的 link-title 损耗，但要求 `<kbd>`/`<sup>` **不丢失**或有可控降级策略）
  - 通过才进 §02 spec 实施；不通过升级 explore 重新评估编辑器
- 删除现有 BlockNote 代码的微循环要单独立 spec（具体见 specs/16-cleanup），保证：
  - 旧 `PostEditor.tsx` 已替换为 `EntryEditor.tsx` 引用新 Milkdown wrapper
  - `src/components/editor/` 下旧文件 grep 0 命中
  - `package.json` 中 `@blocknote/*` 移除，`pnpm-lock.yaml` 重新生成

---

## 不可越线的边界（违反即拒绝合入）

1. 编辑器存储格式必须 Markdown 字符串
2. Channel layout 必须从 5 个预设（CHRONICLE / CARDS / TIMELINE / GREP / FEED）选
3. Entry kind 必须从枚举（ARTICLE / NOTE / LINK / JOKE / HOT_TAKE / QUOTE / REVIEW / GUESTBOOK_THREAD）选
4. 不做 page builder / 拖拽
5. 不做嵌套 Channel
6. 不做用户系统扩展（个人主页 / 关注 / 私信）
7. metadata Json 必须经过对应 kind 的 Zod schema parse 才存
8. 颜色必须用 CSS 变量
9. CSS 必须用语义 utility（`bg-accent` 不是 `bg-amber-500`）
10. 测试 SDD 微循环严格执行（1 spec = 1 [TEST-RED] commit + 1 [IMPL-GREEN] commit）
11. 不留 deprecated 代码 / re-export shim
12. 编辑器内 preview 必须走 `renderMarkdown` 管道（不允许 mini renderer）

---

## 与现有 systemPatterns.md 的关系

本次重构涉及 systemPatterns.md 修改：

| §    | 修改 |
|------|------|
| §14 编辑器契约 | 完全重写：从 NotionMarkdownEditor 改为 Milkdown，解除"禁止 Tiptap/ProseMirror"约束 |
| §13 Markdown 渲染管道 | 不修改，仍是 SSOT |
| §11 评论审核流 | 扩展：加 visibility 字段，加 GUESTBOOK 场景 |
| §10 反垃圾 visitor 指纹 | 扩展：登录用户也参与 rate-limit，userId + visitorHash 组合 |
| §8 主题系统 | 完全重写：从单主题 + 双模 改为路由级三主题硬映射 |
| §2 路由组织 | 完全重写：(site)/columns 删除，新增 /c, /guestbook |
| §3 数据访问 | 不修改 |
| §7 i18n 数据模型 | 不修改（Translation 子表保留，仍单 locale） |
| §9 计数器 | 不修改，Entry 继承相同设计 |

migration-plan.md 第一步是 update memory-bank/systemPatterns.md，开发期间作为唯一约定来源。

---

<!-- 此文件由 explore 自动生成草稿，请审阅。生成时间：2026-05-25T12:00:00Z -->
