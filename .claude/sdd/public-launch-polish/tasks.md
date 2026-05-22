# tasks.md — public-launch-polish

## 1. Markdown reading system

1.1.a [TEST-RED] write failing tests for `markdown-reading-001`, `markdown-reading-002`, `markdown-reading-003`, `markdown-reading-004`

1.1.b [IMPL-GREEN] implement alert transform, `.markdown-body`, preview wrapper update, and sanitize-safe callout markup

## 2. Admin contrast

2.1.a [TEST-RED] write failing tests for `admin-contrast-001` and `admin-contrast-002`

2.1.b [IMPL-GREEN] replace muted background text tokens with semantic foreground tokens in admin shell

## 3. Homepage/about launch polish

3.1.a [TEST-RED] write failing tests for `site-polish-001`, `site-polish-002`, and `site-polish-003`

3.1.b [IMPL-GREEN] add homepage launch narrative sections, about content expansion, and reusable surface/background styles

## 4. i18n and unfinished-work debt

4.1.a [TEST-RED] write failing docs-sanity checks for `i18n-roadmap-001` and `i18n-roadmap-002`

4.1.b [IMPL-GREEN] update memory-bank progress/system patterns/known issues with concrete V2/V3 debt

## 5. Verification

- Run targeted tests after each GREEN.
- Run `pnpm typecheck`, `pnpm lint`, `pnpm test`, and `pnpm build`.
- Start local dev server and audit `/`, `/about`, `/posts`, one post detail if data exists, `/admin`, and `/admin/posts/new` with the in-app Browser.
- Record unresolved launch polish gaps in memory-bank instead of silently dropping them.

