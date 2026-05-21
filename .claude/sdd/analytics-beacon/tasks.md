# tasks.md — analytics-beacon

> 微循环结构：1 spec scenario = 1 微循环
> 阶段前缀 `[P2-A]`
> commit scope 约定：`track-schema` / `analytics-service` / `track-api` / `analytics-beacon` / `site-layout-analytics`

## §0 准备

- [ ] §0.1 SDD 五件套 scaffold commit — `docs(sdd): analytics-beacon scaffold [no-tdd]`

## §A track-schema

- [ ] A.1.a [TEST-RED] 写 `trackPayloadSchema` 边界 3 case 粘 FAIL
- [ ] A.1.b [IMPL-GREEN] `src/lib/schemas/analytics.ts#trackPayloadSchema`

## §B analytics-service

- [ ] B.1.a [TEST-RED] 写 `recordPageView inserts row` + `referrer null when missing` 粘 FAIL
- [ ] B.1.b [IMPL-GREEN] `src/lib/services/analytics.ts#recordPageView`：parseUserAgent + db.pageView.create

## §C track-api

- [ ] C.1.a [TEST-RED] 写 5 case 覆盖 SPEC-A-A-1..5 粘 FAIL
- [ ] C.1.b [IMPL-GREEN] `src/app/api/track/route.ts#POST`：trackPayloadSchema.parse + DNT 守 + path 黑名单 + rate-limit + recordPageView → 204

## §D analytics-beacon

- [ ] D.1.a [TEST-RED] 写 4 case (mount + path change / admin skip / DNT skip / fetch fallback) 粘 FAIL
- [ ] D.1.b [IMPL-GREEN] `src/components/site/AnalyticsBeacon.tsx`：usePathname + useEffect + sendBeacon-or-fetch

## §E layout-integration

- [ ] E.1.a [TEST-RED] 在 `src/app/(site)/layout.test.tsx` 写 `<AnalyticsBeacon />` 渲染（mock 替换）粘 FAIL（或者 layout 现无 test 则新建）
- [ ] E.1.b [IMPL-GREEN] 改 `src/app/(site)/layout.tsx` 嵌 `<AnalyticsBeacon />`

## §F 集成验收

- [ ] F.1 跑 typecheck / lint / test / build 全绿
- [ ] F.2 manual smoke（待 ha1den）：浏览器访问 `/`、`/posts/<slug>`、`/columns/<slug>` 各一次，看 DB PageView 表有对应记录
- [ ] F.3 更新 memory-bank + tasks.md commit 快照

## §G 收尾

- [ ] G.1 commit 历史快照表
- [ ] G.2 ha1den decision：是否进入下一 epic（3 SDD archive / Hero design pass / 其他）

## 备注

- DNT 客户端 + 服务端双守
- path 黑名单客户端 + 服务端双守
- rate-limit 复用 lib/rate-limit.ts，单 VPS 实例 OK
- 不修改 Prisma schema（PageView 表 P0 已就绪）
