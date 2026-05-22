# public-launch-polish proposal

## Problem

TZBlog has the core CMS and public reading flow in place, but the pre-launch UI still reads as a working skeleton in several places:

- Markdown output relies on `prose` classes even though the typography plugin is not installed, so articles and editor previews do not have a fully controlled reading system.
- Important Markdown structures such as alerts, links, code blocks, tables, blockquotes, and inline emphasis do not yet have a distinct editorial treatment.
- The homepage and about page communicate the project, but they need stronger visual depth and clearer "what this site is" storytelling before launch.
- The admin sidebar has a light-mode contrast regression because navigation text uses the muted surface token instead of the muted foreground token.
- Locale infrastructure is only a schema/helper placeholder. The site exposes `SUPPORTED_LOCALES = ["zh", "en"]`, but routing, dictionaries, SEO, RSS, and UI copy remain single-locale.

## Scope

This SDD implements the launch-facing polish that is safe to do before P3:

- Add a project-owned `.markdown-body` reading system and GitHub-style alert rendering.
- Keep Markdown source editing intact; only improve rendered preview/published output and existing source editor CSS edge cases if encountered.
- Fix admin layout contrast using semantic foreground tokens.
- Improve homepage/about presentation around TZBlog's stack, implementation direction, and product story.
- Record i18n as V3 architecture debt with concrete route/dictionary/SEO requirements, rather than doing a risky route tree migration in this pass.

## Out of Scope

- Full locale routing migration to `app/[lang]` or a next-intl routing setup.
- Installing new design dependencies or replacing the editor implementation.
- Database schema changes.
- Visual regression automation beyond existing Vitest and the final browser audit.

## Success Criteria

- Markdown alerts support `> [!NOTE]`, `> [!TIP]`, `> [!IMPORTANT]`, `> [!WARNING]`, and `> [!CAUTION]`.
- Markdown rendering keeps sanitize protection while allowing the new alert markup and styling hooks.
- The public article renderer and admin editor preview use the same `.markdown-body` styles.
- Homepage and about page include stronger project/tech/process information with intentional background depth and reveal details.
- Admin sidebar navigation and header metadata are readable in light mode.
- V2/V3 debt records explicitly call out unfinished i18n and remaining launch polish items.

