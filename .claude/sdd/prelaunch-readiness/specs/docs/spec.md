# docs specs

## SCENARIO: prelaunch-docs-001

**GIVEN** project docs are used as handoff context
**WHEN** README, AGENTS, CLAUDE, docs, and memory-bank files are scanned
**THEN** active docs no longer claim Next.js 15, Prisma 5, Tiptap WYSIWYG as the current admin editor, or `src/middleware.ts` as the active request guard.

## SCENARIO: prelaunch-docs-002

**GIVEN** `memory-bank/progress.md` is the durable project status
**WHEN** it is inspected
**THEN** completed P2/P4 items are checked, resolved `window.confirm` debt is removed, and active debt/backlog reflects the current codebase.

