# Proposal — analytics-beacon (P2 收尾)

> Stage: P2 前台展示收尾 — 自研 Analytics 客户端上报
> Created: 2026-05-21
> Path: `.claude/sdd/analytics-beacon/`

## Why

`Post.viewCount` 已有路由 `/api/posts/[slug]/view` 处理（D3 之前 P0 阶段），但**全局 PageView**（自研 Analytics 后台仪表盘的基石）没有上报路径，PageView 表始终 0 行。

不修这层，P4 后台仪表盘没有数据可看，"自研 Analytics 替代 Umami" 度量指标无法达成。

## What

P2 Analytics 客户端上报范围：

### Capability: track-schema
- `trackPayloadSchema`: `{ path: "/" 开头 max 500, referrer? max 500 url-or-empty }`

### Capability: analytics-service
- `recordPageView({ path, visitorHash, ua, referrer? })`：调 `parseUserAgent(ua)` → insert PageView

### Capability: track-api `/api/track`
- POST 接收 trackPayload
- **DNT 守卫**：`req.headers["dnt"] === "1"` → 204 不入库（R14）
- **path 黑名单**：path 以 `/admin` `/api` `/login` 开头 → 204 不入库（R10 服务端 sanity check）
- **rate-limit**：`analytics:${visitorHash}` 60 次/分钟（R11 不去重，rate-limit 兜底）
- 通过后 `recordPageView` → 204 No Content（轻量响应）

### Capability: analytics-beacon
- `<AnalyticsBeacon>` client component：
  - `usePathname()` 监听 path 变化
  - **客户端 DNT 检查**：`navigator.doNotTrack === "1"` → skip
  - **客户端 path 黑名单**：`/admin/*` `/login` skip
  - 优先 `navigator.sendBeacon(url, blob)` → 失败 fallback `fetch(url, { method: "POST", keepalive: true })`
  - body 含 path + 当前 `document.referrer`（R12）

### Capability: site-layout-integration
- `<AnalyticsBeacon />` 嵌入 `src/app/(site)/layout.tsx`，全局自动生效

### 不在范围（推迟）
- **Analytics dashboard**（admin /admin/analytics 仪表盘）→ P4
- **Session 概念 / bounce rate**：当前 PageView 表无 session id 字段，按 V2 设计
- **客户端事件追踪**（点击、滚动深度）→ V2
- **A/B 测试** → V3

## Decisions made before kicking off

| # | 矛盾 / 备选 | 决策 | Reason |
|---|---|---|---|
| R10 | admin 后台是否上报 | **不上报**（客户端 + 服务端双黑名单）| 避免污染统计；运营动作不算"访客访问" |
| R11 | 同 vh 同 path 短时重复 | **不去重**，rate-limit 60/min 兜底 | SPA 路由切换多次访问是真行为；额外 SELECT 查重浪费 |
| R12 | 记 referrer | **记 document.referrer** | P4 仪表盘需"流量来源" |
| R13 | path 黑名单 | **/admin/* /api/* /login 一定不上报** | R10 实现细节 |
| R14 | 尊重 DNT (Do Not Track) | **尊重**：req.headers.DNT==1 → 204 不入库 | 合规预备 + 用户尊重 |

## Capabilities 摘要

| capability | spec 文件 | spec-id 范围 |
|---|---|---|
| track-schema | `specs/track-schema/spec.md` | SPEC-A-S-1..3 |
| analytics-service | `specs/analytics-service/spec.md` | SPEC-A-V-1..2 |
| track-api | `specs/track-api/spec.md` | SPEC-A-A-1..5 |
| analytics-beacon | `specs/analytics-beacon/spec.md` | SPEC-A-B-1..4 |
| layout-integration | `specs/layout-integration/spec.md` | SPEC-A-L-1 |

## Impact

- 新建：~6 文件（schema/service/api/beacon + 3 测试）
- 修改：`src/app/(site)/layout.tsx` 嵌 Beacon
- 不动 Prisma schema（PageView 表 P0 已就绪）
- 不动 .env
- 不装新依赖

## Out of scope

- Analytics dashboard UI
- Session / Bounce / Time-on-page
- 事件追踪 / 转化追踪
- A/B 测试
- 反爬虫 bot 检测

## Workflow

按 D3/C 教训，全程严格 SDD：
1. proposal + 5×spec + test-map + tasks 一次性建好 commit scaffold
2. 每微循环 test → feat 双 commit 节奏
3. scope 建议：`track-schema` / `analytics-service` / `track-api` / `analytics-beacon` / `site-layout-analytics`
