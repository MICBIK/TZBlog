# Known Deviations

| Spec-ID | Deviation | Impact |
|---------|-----------|--------|
| mig-001 | `migration.test.ts` moved from `prisma/migrations/__tests__/` to `prisma/__tests__/` because Prisma 7 treats every child directory under `prisma/migrations/` as a migration folder and fails `migrate dev/reset/status` when it finds no `migration.sql`. | Test behavior is unchanged; final Prisma CLI quality gates can run without a harness-specific move step. |
