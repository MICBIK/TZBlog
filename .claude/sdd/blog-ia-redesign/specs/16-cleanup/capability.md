# Spec 16 · Cleanup

> 旧代码彻底删除：不留 `_deprecated` / re-export shim / 注释残骸。所有 grep 关键字在 `src/` + `prisma/schema.prisma` 应 **0 命中**。
>
> Reference: `proposal.md` D8 / `design-notes.md` A7 + Q11 / `editor-comparison.md` §8

---

## Intent

切到新元模型后，把所有旧 Post/Column/HomeGarden/PostEditor/BlockNote/CodeMirror 代码物理 delete，避免"屎山"。每条 cleanup 路径都用 grep 守门，CI 检测残留。

---

## Cleanup Targets

### A · Prisma schema（删除）

```
prisma/schema.prisma：
- model Post
- model PostTranslation
- model Column
- model ColumnTranslation
- model TagsOnPosts
- model PostView
- model PostLike
- enum PostStatus（被 EntryStatus 替代）
```

### B · 旧组件（删除）

```
src/components/editor/NotionBlockEditor.tsx
src/components/editor/NotionBlockEditor.test.tsx
src/components/editor/markdownBridge.ts
src/components/editor/markdownBridge.test.tsx
src/components/editor/notionEditorAdapter.ts
src/components/editor/notionEditorAdapter.test.ts
src/components/editor/predecessorRemoval.test.ts
src/components/editor/MarkdownEditor.tsx
src/components/editor/MarkdownEditor.test.tsx
src/components/editor/MarkdownEditorWithPreview.tsx
src/components/editor/MarkdownEditorWithPreview.test.tsx
src/components/editor/MarkdownPreview.tsx
src/components/editor/MarkdownPreview.test.tsx
src/components/editor/EditorToolbar.tsx
src/components/editor/EditorToolbar.test.tsx
src/components/editor/editor-chrome-locale.test.tsx
src/components/editor/preview-parity.test.tsx
src/components/editor/__fixtures__/  (POC 时期遗留 fixture 目录)

src/components/site/HomeGarden.tsx + .test.tsx
src/components/site/HomeHero.tsx + .test.tsx
src/components/site/HomeFeaturedAndRecent.tsx + .test.tsx
src/components/site/HomeColumns.tsx + .test.tsx
src/components/site/HomePrinciples.tsx + .test.tsx
src/components/site/HeroEditorial.tsx + .test.tsx

src/components/admin/posts/PostEditor.tsx + .test.tsx
src/components/admin/posts/PostMetaSidebar.tsx + .test.tsx
（整个 src/components/admin/posts/ 目录 → 改为 src/components/admin/entries/）
```

### C · 旧 service / lib（删除）

```
src/lib/services/posts.ts (listPosts / getPostBySlug)
src/lib/services/columns.ts
src/lib/services/comments.ts （保留但重写，挂在 Entry 而不是 Post）
src/lib/schemas/post.ts
src/lib/schemas/column.ts
```

### D · 旧 API routes（删除）

```
src/app/api/admin/posts/route.ts
src/app/api/admin/posts/[id]/route.ts
src/app/api/admin/columns/route.ts
src/app/api/admin/columns/[id]/route.ts
src/app/api/posts/route.ts
src/app/api/posts/[slug]/route.ts
src/app/api/columns/route.ts
src/app/api/columns/[slug]/route.ts
```

### E · 旧公开路由（删除 + 重写）

```
src/app/(site)/columns/page.tsx + .test.tsx + [slug]/page.tsx + [slug]/page.test.tsx
src/app/(site)/posts/page.tsx + .test.tsx
（保留 src/app/(site)/posts/[slug]/page.tsx，但重写为查 Entry where kind=ARTICLE）

src/app/(site)/page.tsx  （重写：动态读 enabled Channel.order 渲染各 Channel preview block）
src/app/(site)/page.test.tsx  （重写）
```

### F · 旧 admin routes（重写）

```
src/app/(admin)/admin/posts/page.tsx  → src/app/(admin)/admin/entries/page.tsx
src/app/(admin)/admin/posts/[id]/edit/page.tsx → src/app/(admin)/admin/entries/[id]/edit/page.tsx
src/app/(admin)/admin/posts/new/page.tsx → src/app/(admin)/admin/entries/new/page.tsx
src/app/(admin)/admin/columns/page.tsx → 整个目录删
（新增 src/app/(admin)/admin/channels/  做 Channel CRUD）
```

### G · package.json deps（删除）

```
@blocknote/core
@blocknote/react
@blocknote/shadcn
@codemirror/commands
@codemirror/lang-markdown
@codemirror/language
@codemirror/search
@codemirror/state
@codemirror/view
codemirror
```

### H · SDD archive

```
.claude/sdd/notion-block-editor/  →  .claude/sdd/archive/2026-05-25-notion-block-editor/
（加 SUPERSEDED.md footer 链到 blog-ia-redesign）
```

---

## Specs（spec-id 表）

| Spec-ID | GIVEN | WHEN | THEN |
|---------|-------|------|------|
| clean-001 | 切换后 src/ + prisma/ | `grep -r "model Post " prisma/` | 0 命中 |
| clean-002 | 切换后 src/ | `grep -r "model Column " prisma/` | 0 命中 |
| clean-003 | 切换后 src/ | `grep -r "HomeGarden\|HomeHero\|HomeFeaturedAndRecent\|HomeColumns\|HomePrinciples" src/` | 0 命中 |
| clean-004 | 切换后 src/ | `grep -r "from \"@blocknote\|from \"@codemirror" src/` | 0 命中 |
| clean-005 | 切换后 src/ | `grep -r "NotionBlockEditor\|markdownBridge\|notionEditorAdapter" src/` | 0 命中 |
| clean-006 | 切换后 src/ | `grep -r "PostEditor\|MarkdownEditor\|MarkdownPreview" src/` | 0 命中（除非有 Entry 上下文同名，但 grep 守门时 -w 全词匹配） |
| clean-007 | 切换后 src/ | `grep -r "listPosts\|getPostBySlug\|Post.findMany" src/` | 0 命中（保留点：仅可以在 Entry where kind=ARTICLE 的语义适配） |
| clean-008 | 切换后 package.json | `grep "@blocknote\|@codemirror\|codemirror" package.json` | 0 命中 |
| clean-009 | 切换后 src/app/(site)/columns | 路径 `ls src/app/(site)/columns/` | 不存在（目录删） |
| clean-010 | 切换后 src/app/(admin)/admin/posts | 路径 `ls src/app/(admin)/admin/posts/` | 不存在（重命名为 entries） |
| clean-011 | 切换后 .claude/sdd/notion-block-editor | 路径 `ls .claude/sdd/notion-block-editor` | 不存在（git mv 到 archive） |
| clean-012 | 切换后 archive 目录 | `ls .claude/sdd/archive/2026-05-25-notion-block-editor/SUPERSEDED.md` | 存在 |
| clean-013 | 切换后 src/components/editor/__fixtures__/round-trip/ | 目录存在（**新** fixture，Milkdown POC 用） | 存在 |
| clean-014 | 切换后 src/components/editor/ 老 fixture | 检查老 fixture 是否被替换 | 老 fixture 删除，仅留新 round-trip 集 |

---

## Test File 映射

`src/__tests__/cleanup-guard.test.ts`（Node fs + child_process exec）：

```typescript
import { describe, test, expect } from 'vitest'
import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = process.cwd()

function grepCount(pattern: string, dir: string): number {
  try {
    const result = execSync(`grep -r ${pattern} ${dir} --include="*.tsx" --include="*.ts" --include="*.prisma" || true`, { encoding: 'utf8' })
    return result.trim() ? result.trim().split('\n').length : 0
  } catch {
    return 0
  }
}

describe('cleanup guard — no legacy code remnants', () => {
  test.each([
    [`"model Post "`, 'prisma/'],
    [`"model Column "`, 'prisma/'],
    [`-w HomeGarden`, 'src/'],
    [`-w HomeHero`, 'src/'],
    [`-w HomeColumns`, 'src/'],
    [`-w HomePrinciples`, 'src/'],
    [`-w HomeFeaturedAndRecent`, 'src/'],
    [`-w NotionBlockEditor`, 'src/'],
    [`@blocknote`, 'src/'],
    [`@codemirror`, 'src/'],
    [`from \\"@/lib/services/posts\\"`, 'src/'],
    [`-w PostEditor`, 'src/'],
    [`-w MarkdownEditorWithPreview`, 'src/'],
  ])('no occurrences of %s in %s', (pattern, dir) => {
    expect(grepCount(pattern, join(ROOT, dir))).toBe(0)
  })

  test('legacy directory src/app/(site)/columns absent', () => {
    expect(existsSync(join(ROOT, 'src/app/(site)/columns'))).toBe(false)
  })

  test('legacy directory src/app/(admin)/admin/posts absent', () => {
    expect(existsSync(join(ROOT, 'src/app/(admin)/admin/posts'))).toBe(false)
  })

  test('legacy notion-block-editor SDD archived', () => {
    expect(existsSync(join(ROOT, '.claude/sdd/notion-block-editor'))).toBe(false)
    expect(existsSync(join(ROOT, '.claude/sdd/archive/2026-05-25-notion-block-editor/SUPERSEDED.md'))).toBe(true)
  })

  test('package.json no longer references blocknote / codemirror', () => {
    const pkg = JSON.parse(execSync('cat package.json', { encoding: 'utf8' }))
    const all = JSON.stringify({ ...pkg.dependencies, ...pkg.devDependencies })
    expect(all).not.toMatch(/@blocknote/)
    expect(all).not.toMatch(/@codemirror/)
    expect(all).not.toMatch(/"codemirror"/)
  })
})
```

---

## Acceptance（高层）

- [ ] 所有 clean-001 ~ clean-014 spec 全 pass
- [ ] `pnpm typecheck` 0 error（无悬空 import）
- [ ] `pnpm lint` 0 warning（无 unused import）
- [ ] `pnpm test` 全绿（无引用旧表的 mock 残留）
- [ ] `pnpm build` 成功
- [ ] CI 加 `cleanup-guard.test.ts` 作为最后一道闸

---

## Don't（边界）

- 不留 `// removed in blog-ia-redesign` 注释（grep 检测）
- 不留 `_deprecated_postEditor.tsx` 文件
- 不留 `export { Entry as Post }` re-export
- 不为兼容旧 URL 加 redirect map（D7 锁定）

---

<!-- 此文件由 explore 自动生成草稿，请审阅。生成时间：2026-05-25T13:30:00Z -->
