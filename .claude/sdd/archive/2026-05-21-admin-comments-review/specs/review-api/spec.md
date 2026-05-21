# Spec — review-api (C)

> Capability: admin REST API
> Stage: P1-C / §C
> SPEC-ID 前缀：`SPEC-C-A-`

## Domain rules

- 全部路由放 `/api/admin/comments/`，受 middleware 守护（未登录 401）
- 与 admin/posts API 一致的响应壳：`ok({...})` / `failure(err)`
- 改动操作必传 reviewerId（从 session 取）；service 层负责写入 reviewedBy

## Specs

### SPEC-C-A-1 — GET /api/admin/comments 列表 + filter

**GIVEN** 已登录的 admin session（mock auth）
**WHEN** `GET /api/admin/comments?status=PENDING&page=1&pageSize=20`
**THEN** 响应 `200` + `{ data: [...], meta: { total, page, pageSize } }`
**AND** body.data 含 PENDING 评论

### SPEC-C-A-2 — PATCH /api/admin/comments/[id] 单条

**GIVEN** 已登录，PENDING 评论 `c1`
**WHEN** `PATCH /api/admin/comments/${c1.id}` body `{ "status": "APPROVED" }`
**THEN** 响应 `200`，DB c1 status=APPROVED + reviewedBy=session.user.id

### SPEC-C-A-3 — DELETE /api/admin/comments/[id]

**GIVEN** 已登录，PENDING 评论 `c1`
**WHEN** `DELETE /api/admin/comments/${c1.id}`
**THEN** 响应 `200`，DB 行已删

### SPEC-C-A-4 — POST /api/admin/comments/bulk 批量

**GIVEN** 已登录，3 个 PENDING 评论 ids
**WHEN** `POST /api/admin/comments/bulk` body `{ "ids": [...], "status": "APPROVED" }`
**THEN** 响应 `200` + `{ data: { updated: 3 } }`，DB 3 行 status=APPROVED

### SPEC-C-A-5 — 未登录 → 401

**GIVEN** auth.mock 返 null（未登录）
**WHEN** 任意 admin/comments API 调用
**THEN** 响应 `401` + `{ error: { code: "UNAUTHORIZED" } }`
