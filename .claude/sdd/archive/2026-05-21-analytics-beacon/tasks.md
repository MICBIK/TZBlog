# tasks.md — analytics-beacon

> 微循环结构：1 spec scenario = 1 微循环
> 阶段前缀 `[P2-A]`
> commit scope 约定：`track-schema` / `analytics-service` / `track-api` / `analytics-beacon` / `site-layout-analytics`

## §0 准备

- [x] §0.1 SDD 五件套 scaffold commit — `4900742` `docs(sdd): analytics-beacon scaffold [no-tdd]`

## §A track-schema

- [x] A.1.a [TEST-RED] 9 边界用例 — commit `40abf9a`
- [x] A.1.b [IMPL-GREEN] `trackPayloadSchema`: path startsWith / max + referrer url-or-empty optional — commit `aaa99dc`

## §B analytics-service

- [x] B.1.a [TEST-RED] 3 case (parsed UA + null referrer 两种) — commit `49d1a95`
- [x] B.1.b [IMPL-GREEN] `recordPageView`: parseUserAgent + db.pageView.create + 空字符串 referrer 归 null — commit `1c35b80`

## §C track-api

- [x] C.1.a [TEST-RED] 5 case (204 + DNT 204 + 黑名单 204 + 429 + 400 zod) — commit `ae55d75`
- [x] C.1.b [IMPL-GREEN] POST /api/track: DNT 守 → zod.parse → 黑名单正则 → rate-limit 60/min → recordPageView → 204 — commit `96835d5`

## §D analytics-beacon

- [x] D.1.a [TEST-RED] 5 jsdom case (mount + path / admin skip / login skip / DNT skip / fetch fallback) — commit `47c33d0`
- [x] D.1.b [IMPL-GREEN] `<AnalyticsBeacon>` "use client" + usePathname + useEffect + 客户端 DNT/黑名单守 + sendBeacon or fetch keepalive — commit `b9a4653`

## §E layout-integration

- [x] E.1.a [TEST-RED] `src/app/(site)/layout.test.tsx` 1 case，含 4 个 mock 子组件 + AnalyticsBeacon testid — commit `8599209`
- [x] E.1.b [IMPL-GREEN] SiteLayout 嵌入 `<AnalyticsBeacon />`（在 Toaster 后）— commit `ccab40e`

## §F 集成验收

- [x] F.1 跑 typecheck / lint / test 全绿（52 files / 352 passed / 1 skipped，基线 329 → 352，+23 specs）
- [x] F.2 跑 build 确认 `/api/track` 在编译产物
- [ ] F.3 manual smoke（待 ha1den）：浏览器访问 `/`、`/posts/<slug>`、`/columns/<slug>` 各一次，检查 DB `PageView` 表对应行；admin 路径不应有记录
- [x] F.4 memory-bank + tasks.md commit 快照同步

## §G 收尾

- [x] G.1 commit 历史快照表（见下方）
- [ ] G.2 ha1den decision：是否进入下一 epic（3 SDD archive / Hero design pass / 其他）

## Commit 历史快照

| commit | 阶段 | spec id |
|---|---|---|
| `4900742` | §0.1 SDD scaffold [no-tdd] | — |
| `40abf9a` | §A.1.a track-schema [TEST-RED] | SPEC-A-S-1..3 |
| `aaa99dc` | §A.1.b track-schema [IMPL-GREEN] | SPEC-A-S-1..3 |
| `49d1a95` | §B.1.a analytics-service [TEST-RED] | SPEC-A-V-1..2 |
| `1c35b80` | §B.1.b analytics-service [IMPL-GREEN] | SPEC-A-V-1..2 |
| `ae55d75` | §C.1.a track-api [TEST-RED] | SPEC-A-A-1..5 |
| `96835d5` | §C.1.b track-api [IMPL-GREEN] | SPEC-A-A-1..5 |
| `47c33d0` | §D.1.a analytics-beacon [TEST-RED] | SPEC-A-B-1..4 |
| `b9a4653` | §D.1.b analytics-beacon [IMPL-GREEN] | SPEC-A-B-1..4 |
| `8599209` | §E.1.a site-layout-analytics [TEST-RED] | SPEC-A-L-1 |
| `ccab40e` | §E.1.b site-layout-analytics [IMPL-GREEN] | SPEC-A-L-1 |

> 节奏：scaffold 1 + 5 个 commit pair = 11 commit，scope 一致，husky 全过。
> test 基线 329 → 352（+23 specs）：schema 9 + service 3 + api 5 + beacon 5 + layout 1 = 23。
> 不动 Prisma schema（PageView 表 P0 已就绪）。
