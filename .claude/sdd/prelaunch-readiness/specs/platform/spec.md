# platform specs

## SCENARIO: prelaunch-platform-001

**GIVEN** the project runs on Next.js 16
**WHEN** the request guard entrypoint is inspected
**THEN** `src/proxy.ts` exists, exports the auth guard and matcher, and `src/middleware.ts` no longer exists.

## SCENARIO: prelaunch-platform-002

**GIVEN** Prisma 7 driver adapters are stable in this project
**WHEN** `prisma/schema.prisma` is inspected
**THEN** the client generator does not declare deprecated `previewFeatures = ["driverAdapters"]`.

