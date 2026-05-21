# Spec — analytics-service

> Capability: PageView 入库
> Stage: P2-Analytics §B
> SPEC-ID 前缀：`SPEC-A-V-`

## Domain rules

- `recordPageView({ path, visitorHash, ua, referrer? })`：
  - 调 `parseUserAgent(ua)` 拆 device / browser / os
  - insert PageView 行
- 不去重（R11 决策），同 vh+path 可以多条
- 不抛错除非 DB 异常（rate-limit / path 黑名单在 API 层）

## Specs

### SPEC-A-V-1 — recordPageView inserts a PageView row with parsed UA

**GIVEN** clean PageView 表
**WHEN** `recordPageView({ path:"/", visitorHash:"v1", ua:"Mozilla/5.0 (Macintosh; Intel Mac OS X) Chrome/120", referrer:"https://google.com" })`
**THEN** PageView 多一行：
  - `path: "/"`
  - `visitorHash: "v1"`
  - `referrer: "https://google.com"`
  - `userAgent: <full UA>`
  - `device: "desktop"`
  - `browser: "Chrome"`
  - `os: "macOS"`
  - `createdAt` ≈ now

### SPEC-A-V-2 — recordPageView treats missing referrer as null

**GIVEN** clean PageView 表
**WHEN** `recordPageView({ path:"/posts/hi", visitorHash:"v2", ua:"UA" })`（referrer 不传）
**THEN** PageView 多一行 `referrer: null`
