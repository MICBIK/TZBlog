# design-notes — tags-pages

## ASCII mockup — `/tags`

```
─────────────────────────────────────────
                                          
  TAGS · INDEX                            
  ──                                      
                                          
  Tags                                    ← serif h1
                                          
  ─────────────────  ─────────────────    
  TypeScript     8   Next.js          5   ← 2 列 grid (sm:)
  React          6   Prisma           4   
  CSS            5   Docker           3   
  ─────────────────  ─────────────────    
                                          
─────────────────────────────────────────
```

每行：name (serif) + count (mono right-aligned) + bottom border hover state。

## ASCII mockup — `/tags/typescript`

```
─────────────────────────────────────────
                                          
  TAG                                     
  ──                                      
                                          
  TypeScript                              ← serif h1
                                          
  8 posts                                 ← mono subtitle
                                          
─────────────────────────────────────────
                                          
  Post Title One                          ← PostCard
  Excerpt line ...                        
  May 15 · TypeScript · React             
                                          
  ─                                       
                                          
  Post Title Two                          
  ...                                     
                                          
  ←  1  2  →                              ← pagination
                                          
─────────────────────────────────────────
```

## Locked decisions

R1-R8 详 proposal。重申：
- **`/tags/{slug}` 是 SSR truth**；`/posts?tag=` query 保留兼容但不再是主入口
- **count 只算 PUBLISHED**
- **tags-public.ts** 新文件，不动 admin tags.ts
- **复用 PostCard + listPosts**，零重复实现

## Prisma _count 用法（验证后）

```ts
const tags = await db.tag.findMany({
  select: {
    slug: true,
    name: true,
    _count: {
      select: {
        posts: {
          where: { post: { status: "PUBLISHED" } }
        }
      }
    }
  },
  orderBy: [
    { posts: { _count: "desc" } },
    { name: "asc" }
  ]
})
```

Prisma 5 支持 `_count.select.relation.where`。若版本不支持，fallback：手动 group by + post status filter。先按上式实现，若 prisma 报错，handoff 提示用 alternative：

```ts
// fallback if _count with where not supported
const tags = await db.tag.findMany({ select: { slug: true, name: true }, include: { posts: { where: { post: { status: "PUBLISHED" } }, select: { postId: true } } } })
return tags.map(t => ({ slug: t.slug, name: t.name, count: t.posts.length }))
```

## Pagination snippet to copy from posts list

参考 `src/app/(site)/posts/page.tsx` line 36+ 的 pagination。直接抄到 tags/[slug]/page.tsx 末尾。模式：
- prev: `<Link href={\`?page=${page - 1}\`}>`
- next: 同上
- 当前页 disable

## Anti-template checklist

- [x] hairline label + rule line per page
- [x] serif h1
- [x] mono count
- [x] semantic list `<ul><li>`
- [x] PostCard 已 Editorial-aligned（如果 hero-editorial 没改 PostCard，PostCard 维持原样）

## 不要做的事

- 不动 admin tags.ts
- 不改 listPosts 签名
- 不删 postFilterSchema.tag (R2 保留)
- 不加 tag color / icon
- 不实现 RSS per tag
- 不在 tags index 加 search box（MVP）
