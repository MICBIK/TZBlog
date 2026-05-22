# public-launch-polish design notes

## External references reviewed

- GitHub Markdown Alerts: uses blockquote-based alert syntax with five alert types: `NOTE`, `TIP`, `IMPORTANT`, `WARNING`, and `CAUTION`. Guidance: alerts should emphasize crucial information and use distinctive color/icon treatment. Source: https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax#alerts
- Docusaurus Admonitions: supports typed admonitions (`note`, `tip`, `info`, `warning`, `danger`) with Markdown content inside a bordered container. Source: https://docusaurus.io/docs/markdown-features/admonitions
- Astro Starlight Asides: documents a compact type set (`note`, `tip`, `caution`, `danger`) and pairs each type with a distinct color/icon intent. Source: https://starlight.astro.build/components/asides/
- Material for MkDocs Admonitions: supports many admonition types and uses the default type as fallback for unknown qualifiers. Source: https://squidfunk.github.io/mkdocs-material/reference/admonitions/
- Tailwind CSS theme variables: v4 encourages `@theme` variables as design tokens and utilities API. Source: https://tailwindcss.com/docs/theme
- Next.js internationalization guide: recommends sub-path or domain i18n, locale detection in Proxy, and nesting special files under `app/[lang]` for route params. Source: https://nextjs.org/docs/app/guides/internationalization
- next-intl App Router routing setup was checked as a likely V3 candidate for dictionaries and locale-aware navigation. Source: https://next-intl.dev/docs/routing/setup

## Design conclusions

- Use GitHub alert syntax as the authoring format because it is familiar in Markdown source and does not require MDX or new dependencies.
- Use a restrained editorial palette rather than saturated documentation-theme colors. Alerts should be obvious but still fit the black/white/gray + single accent direction already locked in `handoff-pre-deploy/design-system.md`.
- Use semantic classes and CSS variables instead of inline color styles, so dark mode and future theme GUI can adjust behavior without changing renderer output.
- Do not depend on `@tailwindcss/typography` for launch. The repo currently does not install the plugin, so `.prose` is not a dependable reading system. Define `.markdown-body` in `globals.css`.
- Keep code blocks dark and tactile, because Shiki currently uses a dark GitHub theme. The outer treatment should provide padding, radius, scroll behavior, and subtle borders without overriding token spans.
- Links should be visible without becoming "default blue". Use accent underlines, offset, and hover fill.
- Homepage/about polish should preserve the minimal editorial direction: background depth through hairlines, gradients, cards, and small motion, not heavy marketing blobs.

## Alert mapping

| Markdown token | Class suffix | Visual intent |
|---|---|---|
| `[!NOTE]` | `note` | blue/ink information |
| `[!TIP]` | `tip` | green practical guidance |
| `[!IMPORTANT]` | `important` | amber emphasis for goal-critical content |
| `[!WARNING]` | `warning` | orange risk / attention |
| `[!CAUTION]` | `caution` | red negative outcome / destructive risk |

## i18n decision

The current site has translated data models and `SUPPORTED_LOCALES`, but no locale-aware route tree. Implementing this correctly requires:

- Moving public routes/special files under `app/[lang]` or adopting next-intl routing.
- Updating `proxy.ts` to negotiate/redirect locale without breaking admin/auth/API guards.
- Adding dictionaries for static UI copy.
- Making metadata, sitemap, RSS, OG images, and canonical/alternate links locale-aware.
- Auditing existing service calls to pass locale from route params instead of a hardcoded helper.

This is V3 scope. This pass records the debt and improves single-locale launch content; it does not ship partial i18n that would create SEO and route instability before P3.

## Browser audit checklist

- `/`: hero/background depth, project showcase sections, recent posts empty/data state, mobile stack.
- `/about`: section hierarchy, project story cards, contact links, mobile readability.
- `/posts`: list readability and empty/data state.
- `/posts/[slug]` if sample data exists: `.markdown-body`, callouts, code blocks, TOC spacing.
- `/admin`: sidebar text contrast in light mode, dashboard cards.
- `/admin/posts/new`: source editor still shows Markdown markers; preview uses `.markdown-body`; toolbar/list/heading behavior smoke.

