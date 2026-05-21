# Spec — track-api `/api/track`

> Capability: PageView ingest endpoint
> Stage: P2-Analytics §C
> SPEC-ID 前缀：`SPEC-A-A-`

## Domain rules

- `POST /api/track`
- 成功 → `204 No Content`（轻量响应，beacon 不读 body）
- DNT (R14): `req.headers.DNT === "1"` → `204` 不入库
- path 黑名单 (R13): path 以 `/admin` `/api` `/login` 开头 → `204` 不入库
- rate-limit (R11)：`analytics:${visitorHash}` 60 次/分钟，超限 → `429 RATE_LIMITED`
- zod 验证失败 → `422`（withErrorHandler 包装）

## Specs

### SPEC-A-A-1 — POST 正常路径 → 204 + PageView 入库

**GIVEN** clean PageView 表
**WHEN** `POST /api/track` body `{ path:"/", referrer:"" }` headers `user-agent: <ua>`
**THEN** 响应 `204` No Content
**AND** PageView 多一行（含 parsed UA + null referrer）

### SPEC-A-A-2 — DNT 头 → 204 不入库

**GIVEN** clean PageView 表
**WHEN** `POST /api/track` body 合法 headers `dnt: 1`
**THEN** 响应 `204`
**AND** PageView 仍为 0 行

### SPEC-A-A-3 — path 黑名单 → 204 不入库

**GIVEN** clean PageView 表
**WHEN** `POST /api/track` body `{ path: "/admin/posts" }` / `{ path: "/api/track" }` / `{ path: "/login" }`
**THEN** 各响应 `204`
**AND** PageView 仍为 0 行

### SPEC-A-A-4 — rate-limit 超限 → 429

**GIVEN** 同 visitorHash 在窗口内已上报 60 次
**WHEN** 第 61 次 `POST /api/track`
**THEN** 响应 `429` + `{ error: { code: "RATE_LIMITED" } }`
**AND** PageView 仍为 60 行（不入新行）

### SPEC-A-A-5 — zod 校验失败 → 422

**GIVEN** clean PageView 表
**WHEN** `POST /api/track` body `{ path: "no-leading-slash" }`
**THEN** 响应 `422` (withErrorHandler 把 ZodError 转成 400)
**AND** PageView 仍为 0 行
