# Editor Comparison — Milkdown 集成方案

> 决策路径：2026-05-25 ha1den 在被告知 5/24 BlockNote SDD 已 Gate B PASS（37 blocks round-trip + 文档化 `<kbd>/<sup>`、link title 两个损耗）后，仍选择切换到 Milkdown，并 SUPERSEDE BlockNote SDD（详见 D15/D16/Q11）。
>
> 本文档目标：(a) 给 codex 完整 Milkdown 集成代码 skeleton；(b) 提供 P0 fixture round-trip 验收方法（继承 BlockNote SDD 经验）；(c) 对比文档 Milkdown vs BlockNote 决策证据，方便后续追溯。

---

## 1. 关键 fact（已 grep 项目验证）

| 项 | 状态 | 证据 |
|---|------|------|
| `@blocknote/core 0.51.2` | 已安装，本次重构 cleanup 删除 | `package.json:24-26` |
| `@blocknote/react 0.51.2` | 已安装，删 | 同上 |
| `@blocknote/shadcn 0.51.2` | 已安装，删 | 同上 |
| `CodeMirror 6` 全套 | 已安装，删（Milkdown 自带 ProseMirror 编辑层，不需要 CodeMirror） | `package.json:27-32, 46` |
| `next-auth 5.0.0-beta.25` | 已安装，保留（auth 章节用） | `package.json:54` |
| `remark + rehype + Shiki` | 已安装，保留（render pipeline 不变） | `package.json:61-68` |
| `Milkdown` 系列 | **未安装**，需要 codex `pnpm add` | grep 全无 |
| `react-email` / `@react-email/components` | 未安装，需要 codex 加（Resend magic link 邮件模板） | grep 全无 |
| `resend` SDK | 未安装，需要 codex 加 | grep 全无 |

**Cleanup 影响面**（依赖 grep）：
- `import .* @blocknote` → `src/components/editor/NotionBlockEditor.tsx`, `markdownBridge.ts`
- `import .* @codemirror` → `src/components/editor/MarkdownEditor.tsx`
- `import .* notionEditorAdapter` → `src/components/editor/notionEditorAdapter.test.ts`（自身）+ 可能 admin 路径

---

## 2. Milkdown 决策证据（替代 BlockNote 的 4 个理由）

| # | 理由 | 证据 |
|---|------|------|
| 1 | **Markdown AST 为 source-of-truth**（不是 ProseMirror JSON） | Milkdown 内部用 remark + ProseMirror 双向 transform，节点 1:1 映射 markdown AST。BlockNote 用自定义 block schema 序列化为 markdown，所以才有 `normalizeBlockNoteOutput` 30 行 hack（详见 `src/components/editor/markdownBridge.ts:52-67`） |
| 2 | **Inline HTML 可保留**（解决 `<kbd>/<sup>` 损耗） | Milkdown `@milkdown/preset-gfm` + `@milkdown/preset-commonmark` 通过 remark 完整解析 inline HTML；BlockNote `tryParseMarkdownToBlocks` 在 0.51.2 仍丢弃 inline HTML（Gate B results 第 37-41 行：`Inline HTML inside paragraphs (<kbd>, <sup>, etc.) is stripped to plain text`） |
| 3 | **插件原子化**：所有功能（slash menu / bubble menu / code highlight / table / image）都是独立 `MilkdownPlugin`，可按需 tree-shake；BlockNote 0.51.2 是 monolithic（27 transitive deps，单 admin route 增加 ~200KB gzip） | Milkdown core 仅 ~50KB，按需加插件 |
| 4 | **直接接 Shiki**：`@milkdown/plugin-prism` 或自定义 transformer 可对接现有 `src/lib/markdown.ts` 的 Shiki 实例，复用代码块高亮规则 | 现有 `markdown.ts` 已用 Shiki 4.0.2 |

---

## 3. Milkdown 推荐包清单（含版本）

> Milkdown 截至 2025-12 稳定 7.x，与 React 19 / Next.js 16 兼容。具体版本以 `pnpm add` 后 `pnpm-lock.yaml` 为准。

```bash
pnpm add \
  @milkdown/core \
  @milkdown/preset-commonmark \
  @milkdown/preset-gfm \
  @milkdown/theme-nord \
  @milkdown/transformer \
  @milkdown/react \
  @milkdown/plugin-history \
  @milkdown/plugin-clipboard \
  @milkdown/plugin-listener \
  @milkdown/plugin-slash \
  @milkdown/plugin-tooltip \
  @milkdown/plugin-prism \
  @milkdown/plugin-cursor \
  @milkdown/plugin-block \
  @milkdown/plugin-upload \
  @milkdown/plugin-trailing
```

可选（V2 backlog）：
- `@milkdown/plugin-collab` — Y.js 协同（不做）
- `@milkdown/plugin-math` — KaTeX 数学公式（按需）
- `@milkdown/plugin-diagram` — Mermaid（按需）

---

## 4. Milkdown POC Gate（继承 BlockNote SDD round-trip 方法论）

### 4.1 Gate A — 依赖 + 兼容性确认

| 检查 | 通过条件 |
|------|---------|
| 包版本与 React 19 / Next.js 16 兼容 | `pnpm install` 无 peer warning |
| Admin route bundle delta | gzip ≤ 250KB（硬上限 350KB），`pnpm build` 输出验证 |
| ProseMirror 与现有依赖无冲突 | `pnpm why prosemirror-state` 应只一个版本 |
| Mod+S 拦截无 conflict | Milkdown 默认 keymap 不抢 `Mod+S` |
| dynamic import 隔离 RSC | `next/dynamic({ ssr: false })` 可工作 |

### 4.2 Gate B — Round-trip Parity（**必须复用 `.claude/sdd/notion-block-editor/poc/sample.md`**）

POC 路径：`src/components/editor/__fixtures__/round-trip/`

**fixture 必须包含**（继承 BlockNote SDD `sample.md`，原文档 65 行）：

1. heading h1 / h2 / h3 + 中文标题
2. paragraph + 中英混排 + 斜体 + 粗体 + inline code + link + bold-italic 组合
3. 嵌套列表（有序 + 无序）+ 至少一级嵌套
4. blockquote（单行 + 多行）
5. GitHub Alert callouts (`> [!NOTE]`, `> [!TIP]`, `> [!WARNING]`, `> [!IMPORTANT]`, `> [!CAUTION]`)
6. code fence + language hint (ts / bash / json)
7. table（含 header + body + 转义 `\|` + 中文 cell）
8. image relative URL (`/uploads/...`) + 外链
9. **inline HTML**: `<sup>`, `<kbd>` ← BlockNote 这里失败，Milkdown 必须成功或有可控降级
10. link with title: `[text](url "title")` ← BlockNote 这里失败，Milkdown 应成功
11. 文档尾部 trailing newline

**round-trip 测试代码模板**：

```typescript
// src/components/editor/__fixtures__/round-trip.test.ts
import { describe, test, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { milkdownParse, milkdownSerialize } from '@/components/editor/milkdownBridge'
import { renderMarkdown } from '@/lib/markdown'

const fixtures = ['basic', 'list', 'code', 'table', 'alert', 'image-link', 'blockquote', 'mixed'] as const

describe('Milkdown Markdown round-trip parity', () => {
  test.each(fixtures)('preserves %s.md verbatim', async (name) => {
    const source = readFileSync(
      join(__dirname, 'round-trip', `${name}.md`),
      'utf8',
    )
    const parsed = await milkdownParse(source)
    const exported = await milkdownSerialize(parsed)
    expect(exported.trim()).toBe(source.trim())
  })

  test.each(fixtures)('renders same HTML before and after round-trip (%s)', async (name) => {
    const source = readFileSync(
      join(__dirname, 'round-trip', `${name}.md`),
      'utf8',
    )
    const parsed = await milkdownParse(source)
    const exported = await milkdownSerialize(parsed)
    const htmlOriginal = await renderMarkdown(source)
    const htmlRoundTrip = await renderMarkdown(exported)
    expect(normalizeHtml(htmlRoundTrip)).toBe(normalizeHtml(htmlOriginal))
  })
})

function normalizeHtml(html: string): string {
  return html.replace(/\s+/g, ' ').trim()
}
```

### 4.3 Gate C — Editor Shell 集成

`EntryEditor.tsx` 通过 `next/dynamic` 加载 `MilkdownEditor.tsx`，验证：

| 行为 | 通过条件 |
|------|---------|
| 加载现有 draft | initialValue 通过 markdownParse 注入；编辑器渲染等价视觉 |
| onChange 防抖 | 300ms debounce → emit normalized markdown |
| Mod+S 保存 | preventDefault + 触发 onSave callback |
| Slash menu | 输入 `/` 弹出菜单；插入 heading / code / quote / table / image |
| Bubble menu | 选中文本弹出 bold / italic / link / inline-code |
| Image 上传 | 拖拽图片 → 触发 `/api/media/upload` → 成功后插入 markdown `![alt](url)` |
| 代码块高亮 | 输入 ` ```ts ` → 自动激活 Prism / Shiki 高亮 |
| GH alert | 输入 `> [!NOTE]` → 渲染为 alert 块（视觉上） |
| 暗色主题 | `theme="dark"` prop 传入 → 编辑器使用暗色 token |
| Reduced motion | `prefers-reduced-motion: reduce` 时禁用动画 |

### 4.4 Gate D — Production smoke

| 检查 | 命令 / 行为 |
|------|------|
| typecheck | `pnpm typecheck` 0 error |
| lint | `pnpm lint` 0 warning |
| test | `pnpm test` 全绿 + round-trip 8 fixtures 全 pass |
| build | `pnpm build` 成功 + admin route bundle delta 报告 |
| 浏览器 smoke | `/admin/entries/new` light + dark + mobile (375px) + reduced-motion |
| existing data round-trip | 把 seed showcase 的 ARTICLE entries 全部 load + save 一遍，body 哈希前后一致 |

---

## 5. 完整 Milkdown 集成代码 skeleton

### 5.1 `src/components/editor/milkdownBridge.ts`

```typescript
/**
 * milkdownBridge — pure functional helpers between Markdown string and Milkdown
 * editor state. Mirror pattern of legacy markdownBridge.ts but without
 * BlockNote-specific normalizer hacks (Milkdown's serializer is markdown-AST
 * native so the round-trip is 1:1 by design for commonmark + gfm content).
 *
 * Inline HTML (`<kbd>`, `<sup>`) flows through the remark parser unmodified.
 * Link title attribute is preserved by `gfm` preset.
 */
import { Editor, defaultValueCtx, editorViewCtx, parserCtx, serializerCtx } from '@milkdown/core'
import { commonmark } from '@milkdown/preset-commonmark'
import { gfm } from '@milkdown/preset-gfm'

const UNSAFE_URL_PREFIXES = ['blob:', 'data:', 'javascript:']

export function isSafeMediaUrl(url: string): boolean {
  if (typeof url !== 'string' || url.length === 0) return false
  const lowered = url.toLowerCase().trim()
  return !UNSAFE_URL_PREFIXES.some((prefix) => lowered.startsWith(prefix))
}

/**
 * Parse markdown source into a Milkdown editor state object. Returns the
 * editor instance which holds the doc; caller is responsible for cleanup.
 */
export async function milkdownParse(markdown: string): Promise<Editor> {
  const editor = await Editor.make()
    .config((ctx) => {
      ctx.set(defaultValueCtx, markdown)
    })
    .use(commonmark)
    .use(gfm)
    .create()
  return editor
}

/**
 * Serialize a Milkdown editor instance back to markdown. Pure function:
 * does not mutate the editor.
 */
export async function milkdownSerialize(editor: Editor): Promise<string> {
  return editor.action((ctx) => {
    const view = ctx.get(editorViewCtx)
    const serializer = ctx.get(serializerCtx)
    return serializer(view.state.doc)
  })
}
```

### 5.2 `src/components/editor/MilkdownEditor.tsx`

```typescript
'use client'

import * as React from 'react'
import { Editor, defaultValueCtx, rootCtx, editorViewCtx, serializerCtx } from '@milkdown/core'
import { Milkdown, MilkdownProvider, useEditor } from '@milkdown/react'
import { commonmark } from '@milkdown/preset-commonmark'
import { gfm } from '@milkdown/preset-gfm'
import { history } from '@milkdown/plugin-history'
import { clipboard } from '@milkdown/plugin-clipboard'
import { listener, listenerCtx } from '@milkdown/plugin-listener'
import { slash } from '@milkdown/plugin-slash'
import { tooltip } from '@milkdown/plugin-tooltip'
import { prism } from '@milkdown/plugin-prism'
import { cursor } from '@milkdown/plugin-cursor'
import { block } from '@milkdown/plugin-block'
import { upload, uploadConfig } from '@milkdown/plugin-upload'
import { trailing } from '@milkdown/plugin-trailing'

import { isSafeMediaUrl } from './milkdownBridge'

export interface MilkdownEditorProps {
  value: string
  onChange: (markdown: string) => void
  onSave?: () => void
  theme?: 'light' | 'dark'
}

const CHANGE_DEBOUNCE_MS = 300

function MilkdownInner({ value, onChange, onSave, theme = 'light' }: MilkdownEditorProps) {
  const onChangeRef = React.useRef(onChange)
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  React.useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEditor((root) => {
    return Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, root)
        ctx.set(defaultValueCtx, value)
        ctx.update(listenerCtx, (prev) =>
          prev.markdownUpdated((_ctx, markdown) => {
            if (debounceRef.current) clearTimeout(debounceRef.current)
            debounceRef.current = setTimeout(() => {
              onChangeRef.current(markdown)
            }, CHANGE_DEBOUNCE_MS)
          }),
        )
        ctx.update(uploadConfig.key, (prev) => ({
          ...prev,
          uploader: async (files) => {
            const safe = await Promise.all(
              Array.from(files).map(async (file) => {
                const body = new FormData()
                body.append('file', file)
                const res = await fetch('/api/media/upload', { method: 'POST', body })
                if (!res.ok) throw new Error('upload failed')
                const json = (await res.json()) as { data: { url: string; alt?: string } }
                if (!isSafeMediaUrl(json.data.url)) throw new Error('unsafe url')
                return {
                  type: 'image' as const,
                  src: json.data.url,
                  alt: json.data.alt ?? file.name,
                  title: file.name,
                }
              }),
            )
            return safe
          },
        }))
      })
      .use(commonmark)
      .use(gfm)
      .use(history)
      .use(clipboard)
      .use(listener)
      .use(slash)
      .use(tooltip)
      .use(prism)
      .use(cursor)
      .use(block)
      .use(upload)
      .use(trailing)
  }, [])

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
        event.preventDefault()
        onSave?.()
      }
    },
    [onSave],
  )

  React.useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    },
    [],
  )

  return (
    <div
      data-milkdown-editor
      data-theme={theme}
      onKeyDown={handleKeyDown}
      className="milkdown-shell relative w-full overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
    >
      <div className="flex items-center justify-between gap-3 border-b border-border/80 px-3 py-2 text-xs text-muted-fg">
        <span className="font-mono uppercase tracking-[0.14em]">Markdown</span>
        <span className="font-mono">⌘S 保存</span>
      </div>
      <Milkdown />
    </div>
  )
}

export function MilkdownEditor(props: MilkdownEditorProps) {
  return (
    <MilkdownProvider>
      <MilkdownInner {...props} />
    </MilkdownProvider>
  )
}

export default MilkdownEditor
```

### 5.3 `src/components/admin/entries/EntryEditor.tsx` 中接入

```typescript
'use client'

import dynamic from 'next/dynamic'

const MilkdownEditor = dynamic(
  () => import('@/components/editor/MilkdownEditor').then((m) => m.MilkdownEditor),
  {
    ssr: false,
    loading: () => (
      <div
        data-editor-loading
        className="flex min-h-[32rem] items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 text-sm text-muted-fg"
      >
        编辑器加载中…
      </div>
    ),
  },
)

// ...EntryEditor 主体（结构同当前 PostEditor.tsx，将 NotionBlockEditor 引用替换为 MilkdownEditor）
```

### 5.4 主题样式接入

`src/styles/milkdown.css`（globals.css `@layer components` 内引入）：

```css
[data-milkdown-editor] .milkdown {
  --milkdown-color-text: hsl(var(--fg));
  --milkdown-color-bg: hsl(var(--bg));
  --milkdown-color-border: hsl(var(--border));
  --milkdown-color-primary: hsl(var(--accent));
  --milkdown-color-muted: hsl(var(--muted));
  font-family: var(--font-prose);
}

[data-milkdown-editor] .milkdown .ProseMirror {
  outline: none;
  min-height: 20rem;
  padding: 1.5rem 1.75rem;
}

[data-milkdown-editor] .milkdown h1,
[data-milkdown-editor] .milkdown h2,
[data-milkdown-editor] .milkdown h3 {
  font-family: var(--font-display);
  font-weight: 600;
  letter-spacing: -0.02em;
}

[data-milkdown-editor] .milkdown code {
  font-family: var(--font-mono);
  font-size: 0.95em;
  background: hsl(var(--muted));
  padding: 0.1em 0.35em;
  border-radius: 0.25rem;
}

[data-milkdown-editor] .milkdown pre {
  font-family: var(--font-mono);
  border: 1px solid hsl(var(--border));
  border-radius: 0.75rem;
  padding: 1rem 1.25rem;
}

[data-milkdown-editor] .milkdown blockquote {
  border-left: 3px solid hsl(var(--accent));
  padding-left: 1rem;
  color: hsl(var(--muted-fg));
}

[data-milkdown-editor][data-theme='dark'] .milkdown {
  color-scheme: dark;
}
```

---

## 6. P0 Fixture 清单（迁移自 BlockNote SDD）

> 全部放在 `src/components/editor/__fixtures__/round-trip/` 目录，由 `round-trip.test.ts` 加载执行。

| # | 文件 | 主要覆盖 | 来源 |
|---|------|---------|------|
| 1 | `basic.md` | heading h1/h2/h3 + 段落 + emphasize + link | 拆 BlockNote `sample.md` Heading + 段落部分 |
| 2 | `list.md` | 有序 / 无序列表（含一级嵌套）+ task list | 拆 BlockNote `sample.md` List 部分 |
| 3 | `code.md` | code fence + language（ts/bash/json）+ inline code | 拆 BlockNote `sample.md` Code Fence 部分 |
| 4 | `table.md` | table + header + body + 转义 `\|` + 中文 cell | 拆 BlockNote `sample.md` Table 部分 |
| 5 | `alert.md` | GitHub Alert (NOTE/TIP/IMPORTANT/WARNING/CAUTION) | 拆 BlockNote `sample.md` GH Alert 部分 |
| 6 | `image-link.md` | image relative URL + 外链 + link with title | 拆 BlockNote `sample.md` Image + Link 部分 |
| 7 | `blockquote.md` | blockquote 单行 + 多行 + footnote | 拆 BlockNote `sample.md` Blockquote 部分 |
| 8 | `mixed.md` | 全部混合（直接复制 BlockNote `sample.md` 原文，含 `<kbd>` `<sup>` 内联 HTML） | 直接 1:1 复制 |

**关键差异**：第 8 个 `mixed.md` 在 BlockNote SDD 是"接受 inline HTML 损耗"，Milkdown SDD 是"必须 100% 保留"。如果 Milkdown 也无法保留，触发升级 explore 重新评估。

---

## 7. 候选对比简表（决策证据）

| 候选 | 编辑模型 | Markdown round-trip | Inline HTML | Slash menu | Bundle 估算 | TZBlog 适配度 |
|------|---------|-------------------|------------|-----------|-----------|--------------|
| **Milkdown 7.x**（选） | ProseMirror + remark AST 1:1 映射 | 1:1 设计 | 保留（commonmark + gfm preset） | 内置 `@milkdown/plugin-slash` | ~180KB gzip（按需 tree-shake） | ⭐⭐⭐⭐⭐ |
| BlockNote 0.51（弃） | ProseMirror + 自定义 block schema | 有损（`<kbd>/<sup>` 丢失，需 `normalizeBlockNoteOutput` hack） | 不保留 | 内置 | ~200KB gzip | ⭐⭐⭐⭐（已 ship 但被弃） |
| Tiptap + tiptap-markdown（手搓） | ProseMirror + tiptap-markdown 适配 | 视适配器而定 | 视配置而定 | 手搓 | ~150KB gzip + 大量适配代码 | ⭐⭐（维护成本高） |
| Novel（弃 Vercel） | Tiptap + AI fork | 视适配器 | 视配置 | 内置（AI heavy） | ~250KB + AI | ⭐⭐（AI 耦合，不需要） |
| MDXEditor | Lexical | 1:1 设计 | 保留 | 内置 | ~220KB | ⭐⭐⭐（Lexical 生态较新，BlockNote SDD 当时未选） |

---

## 8. 历史 BlockNote SDD 处置（参考 D15 + Q11）

| 文件 | 动作 |
|------|------|
| `.claude/sdd/notion-block-editor/` 整体 | `git mv` 到 `.claude/sdd/archive/2026-05-25-notion-block-editor/` |
| 在归档目录加 `SUPERSEDED.md` | 内容：`本 SDD 已被 .claude/sdd/blog-ia-redesign/ 取代（2026-05-25 决策）。Gate B PASS 的成果（POC fixture + round-trip 方法论）被新 SDD 复用，详见 editor-comparison.md §4 / §6。` |
| `.claude/sdd/block-markdown-shell/` | 已归档（5/24 之前）|
| `.claude/sdd/admin-editor-shell-repair/` | 已归档（5/24 之前）|
| `.claude/sdd/creative-blog-notion-editor/` | 已归档（5/24 之前）|

---

## 9. 风险表

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| Milkdown 7.x 与 React 19 / Next 16 peer 冲突 | 低 | 中 | Gate A 验证；冲突时锁版本或暂时回 React 18 兼容（不太可能） |
| inline HTML round-trip 仍失败 | 中 | 高 | 升级 explore 重新评估；可能候补 MDXEditor |
| 第三方 plugin（@milkdown/plugin-prism）与项目 Shiki 冲突 | 中 | 中 | 自定义 transformer 走 Shiki，禁用 prism 插件 |
| Admin route bundle 超 350KB | 低 | 中 | dynamic import + tree-shake 监控；超阈值时砍 plugin |
| Milkdown 文档示例使用 React 17 模式 | 中 | 低 | 配合 Next 16 App Router 测试；必要时自己写 wrapper |
| Mod+S 与 Milkdown 内部 keymap 冲突 | 低 | 低 | 用 stopPropagation + 在 root 容器上拦截 |

---

## 10. 一次性集成 checklist（供 codex 执行）

- [ ] `pnpm remove @blocknote/core @blocknote/react @blocknote/shadcn`
- [ ] `pnpm remove @codemirror/* codemirror`（除非其他文件还在引用）
- [ ] `pnpm add @milkdown/...`（完整列表见 §3）
- [ ] 创建 `src/components/editor/milkdownBridge.ts`
- [ ] 创建 `src/components/editor/MilkdownEditor.tsx`
- [ ] 创建 `src/components/editor/__fixtures__/round-trip/{basic,list,code,table,alert,image-link,blockquote,mixed}.md`（从 BlockNote `sample.md` 切片）
- [ ] 创建 `src/components/editor/round-trip.test.ts`（测试代码见 §4.2）
- [ ] 创建 `src/styles/milkdown.css` + 在 globals.css 引入
- [ ] 替换 `src/components/admin/entries/EntryEditor.tsx` 中的编辑器引用（PostEditor 已经在 cleanup 范围）
- [ ] `git mv .claude/sdd/notion-block-editor .claude/sdd/archive/2026-05-25-notion-block-editor`
- [ ] 加 `SUPERSEDED.md` footer
- [ ] 跑 `pnpm typecheck && pnpm lint && pnpm test && pnpm build`
- [ ] 浏览器 smoke：light + dark + mobile + reduced-motion

---

<!-- 此文件由 explore 自动生成草稿，请审阅。生成时间：2026-05-25T12:30:00Z -->
