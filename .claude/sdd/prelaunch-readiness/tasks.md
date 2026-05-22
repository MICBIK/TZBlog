# tasks.md — prelaunch-readiness

## 1. Platform warnings

1.1.a [TEST-RED] write failing test for prelaunch-platform-001.
1.1.b [IMPL-GREEN] rename `src/middleware.ts` to `src/proxy.ts` and update references.

1.2.a [TEST-RED] write failing test for prelaunch-platform-002.
1.2.b [IMPL-GREEN] remove deprecated Prisma `driverAdapters` preview flag.

## 2. Launch content

2.1.a [TEST-RED] update About content test for prelaunch-content-001.
2.1.b [IMPL-GREEN] replace About placeholder content.

2.2.a [TEST-RED] update TechStack test for prelaunch-content-002.
2.2.b [IMPL-GREEN] update TechStack content to current stack.

## 3. Docs and roadmap

3.1.a [TEST-RED] extend docs sanity tests for prelaunch-docs-001, prelaunch-docs-002, prelaunch-roadmap-001.
3.1.b [IMPL-GREEN] sync README / AGENTS / CLAUDE / docs / memory-bank active status and V2/V3 backlog.

## 4. Verification

4.1 [VERIFY] run `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`.

