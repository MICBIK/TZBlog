# Spec — analytics-beacon

> Capability: `<AnalyticsBeacon>` client component
> Stage: P2-Analytics §D
> SPEC-ID 前缀：`SPEC-A-B-`

## Domain rules

- "use client"
- mount 后 + path 变化时触发上报
- 优先 `navigator.sendBeacon(url, blob)`；失败 fallback `fetch(url, { method:"POST", keepalive:true })`
- 客户端 DNT 检查：`navigator.doNotTrack === "1"` → skip POST
- 客户端 path 黑名单：`/admin` `/login` 开头 → skip POST
- body：`{ path: pathname, referrer: document.referrer }`

## Specs

### SPEC-A-B-1 — mount + path change fires POST with body

**GIVEN** mock sendBeacon + usePathname 返 "/posts/hello"
**WHEN** 渲染 `<AnalyticsBeacon />`
**THEN** `sendBeacon` 调用 1 次，url=`/api/track`，body 是 Blob 含 JSON `{ path:"/posts/hello", referrer:"<document.referrer>" }`

**WHEN** pathname 变成 "/about"
**THEN** sendBeacon 再调一次（共 2 次）含 path:"/about"

### SPEC-A-B-2 — admin / login path 黑名单 skip

**GIVEN** mock sendBeacon + usePathname 返 "/admin/comments"
**WHEN** 渲染 `<AnalyticsBeacon />`
**THEN** sendBeacon 不调（黑名单）

**GIVEN** usePathname 返 "/login"
**WHEN** 渲染
**THEN** sendBeacon 不调

### SPEC-A-B-3 — DNT 浏览器设置 skip

**GIVEN** `navigator.doNotTrack === "1"`，usePathname 返 "/"
**WHEN** 渲染 `<AnalyticsBeacon />`
**THEN** sendBeacon 不调

### SPEC-A-B-4 — sendBeacon 不可用时 fallback fetch

**GIVEN** `navigator.sendBeacon` undefined（旧浏览器），mock fetch
**WHEN** 渲染 `<AnalyticsBeacon />` (path "/")
**THEN** `fetch("/api/track", { method:"POST", keepalive:true, ... })` 被调一次
