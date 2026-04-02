# Design: add-ci-pipeline

## .github/workflows/ci.yml

- Trigger: push/PR to main
- Node 20, pnpm 10.29.2
- Steps: checkout → pnpm install → lint (turbo) → test (web vitest) → build (turbo)
- concurrency: cancel in-progress runs for same branch
