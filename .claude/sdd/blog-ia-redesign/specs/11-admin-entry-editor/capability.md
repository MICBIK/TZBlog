# Spec 11 · Admin Entry Editor

> 后台 `/admin/entries/[id]/edit` 与 `/admin/entries/new` 编辑器页面，集成 MilkdownEditor + per-kind metadata 表单。
>
> Reference: `channel-meta-cms.md` §3 §8.4 / `editor-comparison.md` §5.3

---

## Intent

后台 Entry 编辑器：
- 选 Channel → 联动 kind 候选集（per `design-notes.md` A1）
- 选 Kind → 渲染对应 Zod schema 驱动的 metadata 表单
- Milkdown 编辑器加载 body
- 顶部 sticky toolbar 含「保存草稿」「发布」「归档」按钮
- 右侧 sidebar：slug / publishedAt / channelId / seriesId / tags / metadata
- Mod+S 保存草稿

---

## Specs

| Spec-ID | GIVEN | WHEN | THEN |
|---------|-------|------|------|
| ee-001 | admin 已登录 + Channel ARTICLES 存在 | 访问 `/admin/entries/new?channelId=<id>` | 200，编辑器初始化空 body，kind dropdown 仅含 `ARTICLE` |
| ee-002 | admin 已登录 + Channel NOTES 存在 | 访问 new?channelId=NOTES | kind dropdown 含 `NOTE / QUOTE / LINK` |
| ee-003 | admin 已登录 + Channel GUESTBOOK 存在 | 访问 new?channelId=GUESTBOOK | 返回 403 (admin 不能手动建 GUESTBOOK_THREAD) |
| ee-004 | 选 kind=ARTICLE | 渲染 metadata 表单 | 显示 cover / readingMinutes / toc / ogImage 字段 |
| ee-005 | 选 kind=LINK | 渲染 metadata 表单 | 显示 sourceUrl / sourceTitle / sourceAuthor / thumbnail 字段 |
| ee-006 | 选 kind=HOT_TAKE | 渲染 metadata 表单 | 显示 sourcePlatform / sourceUrl / sourceSnippet 字段 |
| ee-007 | 填完 title + slug + body + kind=ARTICLE + metadata | 点击「保存草稿」 | POST `/api/admin/entries` 返回 200，db 写入 status=DRAFT |
| ee-008 | 编辑已有 ARTICLE | 修改 body + 点击「发布」 | PATCH `/api/admin/entries/<id>` 返回 200，db status=PUBLISHED + publishedAt 自动填 now |
| ee-009 | metadata 字段不符合 Zod schema（如 LINK 缺 sourceUrl） | 提交 | 返回 400 + 显示字段级 error |
| ee-010 | slug 已被占用 | 提交 | 返回 409 + 显示 "slug 已被使用" |
| ee-011 | Mod+S 在编辑器内按下 | 触发 | 自动「保存草稿」（status 不变） |
| ee-012 | Series dropdown 选 series + seriesOrder 输入 | 提交 | db 写入 seriesId + seriesOrder |
| ee-013 | tag dropdown 多选 | 提交 | db TagsOnEntries 写入对应行 |
| ee-014 | 编辑 entry kind=ARTICLE 已发布 | 点击「归档」 | PATCH，status=ARCHIVED |
| ee-015 | 编辑器内拖入图片 | 触发上传 | media library 增加一行，markdown 中插入 `![alt](url)` |

---

## Test File 映射

- `src/components/admin/entries/EntryEditor.test.tsx`
- `src/app/api/admin/entries/route.test.ts`
- `src/app/api/admin/entries/[id]/route.test.ts`
- `src/lib/schemas/entryMetadata.test.ts`

---

## Acceptance

- [ ] ee-001 ~ ee-015 全部 pass
- [ ] `pnpm typecheck` 0 error
- [ ] EntryEditor 在 mobile 375px 可用

---

## Don't

- 不让用户在 admin UI 里自定义 metadata 字段
- 不让用户切 Channel 后清空 body（提示确认）
- 不在 admin 内做 AI 自动补全（V2 backlog）
- 不在 admin 内做 collaborative editing

---

<!-- 此文件由 explore 自动生成草稿，请审阅。生成时间：2026-05-25T13:35:00Z -->
