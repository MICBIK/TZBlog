# specs/readme — README 内容要求

> spec-id 前缀：`SPEC-DOC-R`
> NOTE: SPEC-DOC-R-1..3 是 content spec（写完后人工 review）；SPEC-DOC-R-4 是 TypeScript sanity test。

## SPEC-DOC-R-1 — README 必须包含 6 段标题

```gherkin
GIVEN /README.md

THEN file contains these top-level (## ) headings, in order:
  - # TZBlog (or similar; H1 with project name)
  - ## 介绍 (or What is this)
  - ## 技术栈 (Stack)
  - ## 快速开始 (Quickstart)
  - ## 项目结构 (Project Structure)
  - ## 约定 (Conventions)
  - ## 部署 (Deployment) — links to docs/deployment.md
  - ## License
```

## SPEC-DOC-R-2 — Quickstart 含 5 个具体命令

```gherkin
THEN README contains these commands in code blocks:
  - pnpm install
  - cp .env.example .env (or describe env setup)
  - pnpm docker:dev (or docker compose up for local pg/minio)
  - pnpm db:migrate
  - pnpm db:seed (optional)
  - pnpm dev

AND command block is in ```bash``` fenced code
```

## SPEC-DOC-R-3 — Stack table 含核心技术

```gherkin
THEN README contains a table (or list) covering at minimum:
  - Next.js 15 (App Router)
  - TypeScript 5 strict
  - PostgreSQL 16 + Prisma
  - Tailwind CSS v4 + shadcn/ui
  - Tiptap v2 + tiptap-markdown
  - Auth.js v5 (Credentials)
  - MinIO (S3)
  - Vitest
  - Docker Compose + Caddy
```

## SPEC-DOC-R-4 — Sanity check: no boilerplate phrases

```gherkin
GIVEN /README.md

WHEN test reads README content

THEN file content does NOT contain:
  - "bootstrapped with [`create-next-app`]"
  - "You can start editing the page by modifying `app/page.tsx`"
  - "Deploy on Vercel" (project deploys to self-hosted VPS, not Vercel)

AND file content DOES contain:
  - "TZBlog"
  - "MinIO" (or "S3") and "Caddy"
  - some marker indicating self-deployment (e.g., "Docker Compose" or "VPS")
```

Test (this is the only typed test in this SDD):

```ts
// tests/docs-sanity.test.ts
import { describe, it, expect } from "vitest"
import { readFile } from "node:fs/promises"
import { join } from "node:path"

describe("README sanity", () => {
  it("does not contain create-next-app boilerplate", async () => {
    const content = await readFile(join(process.cwd(), "README.md"), "utf-8")
    expect(content).not.toContain("bootstrapped with [`create-next-app`]")
    expect(content).not.toContain("You can start editing the page by modifying `app/page.tsx`")
    expect(content).not.toContain("Deploy on Vercel")
  })

  it("contains project identity markers", async () => {
    const content = await readFile(join(process.cwd(), "README.md"), "utf-8")
    expect(content).toContain("TZBlog")
    expect(content).toMatch(/MinIO|S3/)
    expect(content).toMatch(/Docker Compose|VPS|Caddy/)
  })
})
```
