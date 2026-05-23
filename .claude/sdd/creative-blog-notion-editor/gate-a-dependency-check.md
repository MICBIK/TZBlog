# Gate A Dependency Check — 2026-05-24

## npm package snapshot

Checked with `pnpm view` on 2026-05-24.

| Package | Version | Notes |
|---------|---------|-------|
| `novel` | `1.0.2` | Notion-style WYSIWYG editor package. Depends on Tiptap v2 packages, `cmdk`, `jotai`, `react-moveable`, `react-tweet`, `katex`, `tippy.js`, drag handle extension. |
| `@mdxeditor/editor` | `4.0.1` | React Markdown rich editor. Depends on Lexical, CodeMirror, mdast/micromark directive/GFM/MDX utilities, Radix components. React 18/19 peer range. |
| `@milkdown/react` | `7.21.1` | React integration for Milkdown. Pulls `@milkdown/crepe` and `@milkdown/kit`. |
| `@tiptap/react` | `3.23.6` | Current Tiptap React package. Peer depends on matching `@tiptap/core@3.23.6` and `@tiptap/pm@3.23.6`. |

## Dependency risk

### Novel

`novel@1.0.2` is closest to the desired Notion-like interaction, but its dependency tree is bound to Tiptap v2 (`@tiptap/*@^2.11.2`). If TZBlog uses Novel directly, the editor stack becomes Novel's pinned v2 ecosystem. If TZBlog builds directly on Tiptap latest, it should use Tiptap v3 and not mix it with Novel's v2 packages.

Decision:

- Do not install both `novel` and standalone Tiptap v3 packages in the same POC.
- If evaluating Novel, install `novel` alone and treat it as a full editor package.
- If evaluating Tiptap directly, use v3 packages and treat Novel as interaction/design reference only.

### MDXEditor

`@mdxeditor/editor@4.0.1` has a larger dependency tree but its model is closer to Markdown persistence: Lexical editor state with Markdown import/export utilities, GFM table/task/directive/MDX support. It is less Notion-like out of the box, but safer as the first real Markdown round-trip candidate.

Decision:

- Use MDXEditor as the first install POC if the next implementation step must touch real packages.
- Wrap MDXEditor with TZBlog's own command/bubble affordances rather than accepting its default toolbar wholesale.

### Milkdown

Milkdown remains third candidate. It is credible for Markdown WYSIWYG, but less aligned with the user's Notion-like preference than Novel/Tiptap, and less directly Markdown-persistence-oriented than MDXEditor for this project.

## Recommended next move

Proceed to `notion-editor-003` with a package-independent `NotionMarkdownEditor` behavior shell first:

1. Define slash command behavior in tests.
2. Implement a minimal editor shell that still emits Markdown.
3. Keep the package integration behind adapter boundaries.
4. After slash/bubble/image contracts are clear, install one real candidate package and replace internals without changing tests.

This avoids locking the project into Novel/Tiptap v2 vs Tiptap v3 before the interaction contract is clear.

