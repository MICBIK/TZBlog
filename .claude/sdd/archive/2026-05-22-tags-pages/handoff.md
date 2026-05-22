# Handoff — tags-pages

> 你（接收 AI）正在执行 TZBlog 的 tags-pages SDD。预计 0.5 天。

## 30 秒概览

加 `/tags` 索引页 + `/tags/[slug]` 详情页，并把 PostCard 上的 tag chip 链接从 `?tag=` 改 `/tags/{slug}`。复用现有 listPosts、PostCard。新建 tags-public service（区别于 admin tags.ts）。

## 阅读顺序

1. master.md / handoff-guide.md / design-system.md / known-findings.md
2. `.claude/sdd/tags-pages/proposal.md`
3. `.claude/sdd/tags-pages/specs/{service,index,detail,link-wire}/spec.md`
4. `.claude/sdd/tags-pages/test-map.md`
5. `.claude/sdd/tags-pages/design-notes.md` — Prisma _count 用法 + fallback + ASCII
6. `.claude/sdd/tags-pages/tasks.md`

## 依赖

- hero-editorial（CSS tokens 如 --text-h1 / --tracking-tight）
- 现有 listPosts service (`src/lib/services/posts.ts` already supports tag filter)
- 现有 PostCard component
- 现有 posts list pagination pattern (可直接抄)

## 执行总览

```
§A service (scope tags-service)
§B index page (scope tags-index)
§C detail page (scope tags-detail)
§D link wire (scope tags-link)
```

8 commits。

## 关键约束

- **新文件 tags-public.ts**，不改 admin tags.ts (R7)
- **count 只算 PUBLISHED** (R3)
- **保留 listPosts 的 tag filter 支持** (R2)
- **404 用 notFound()** (R6)
- **不改 Prisma schema**

## Prisma 兼容性 check

`_count.select.posts.where` 需要 Prisma 5+。
1. 先用 nested where（design-notes 主方案）
2. 若 prisma generate 报错 → fallback 到 design-notes 中的 alternative impl
3. **如果走 fallback**，在 completion-report 备注

## Editorial 风

- 索引页：2 列 grid 列表（sm:）+ name 左 + count 右
- 详情页：复用 posts list 头部 + PostCard 列表

## 验证步骤

`grep -r "posts?tag=" src/` 改完后 component 文件中应为零（admin / query UI 可保留）。

## 禁止事项

| 禁止 | 为什么 |
|------|-------|
| 改 admin tags.ts | R7 隔离 |
| 改 Prisma schema | 不需要 |
| 删 listPosts tag filter | R2 保留兼容 |
| tags index 加 search | MVP |
| 加 tag color/icon | MVP |
| `--no-verify` | 违反 |

## 完成后输出

`.claude/sdd/tags-pages/completion-report.md`，含：
- 8 commits hash
- test counts
- 是否走了 _count fallback
- grep 结果

## TL;DR

```
读 SDD → §A service RED+GREEN → §B index RED+GREEN → §C detail RED+GREEN → §D link-wire RED+GREEN → 质量门 → completion-report → 停。
```

收工。
