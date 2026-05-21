"use client"

import { usePathname } from "next/navigation"
import { useEffect } from "react"

/**
 * <AnalyticsBeacon> — 全局 PageView 上报。
 *
 * - `usePathname()` 监听 path 变化，每次变化触发一次 POST `/api/track`
 * - 客户端 DNT 检查：`navigator.doNotTrack === "1"` 时直接 skip
 * - 客户端 path 黑名单：`/admin` 与 `/login` 开头 skip（服务端冗余）
 * - 优先 `navigator.sendBeacon(url, blob)`，浏览器不支持时回落到
 *   `fetch(url, { method: "POST", keepalive: true })`
 * - body：`{ path: pathname, referrer: document.referrer }`
 */

const BLACKLIST_RE = /^\/(admin|login)(\/|$)/

export function AnalyticsBeacon() {
  const pathname = usePathname()

  useEffect(() => {
    if (!pathname) return
    if (BLACKLIST_RE.test(pathname)) return
    if (typeof navigator === "undefined") return
    if (navigator.doNotTrack === "1") return

    const payload = JSON.stringify({
      path: pathname,
      referrer:
        typeof document !== "undefined" ? document.referrer : "",
    })
    const url = "/api/track"

    if (typeof navigator.sendBeacon === "function") {
      const blob = new Blob([payload], { type: "application/json" })
      navigator.sendBeacon(url, blob)
      return
    }

    void fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => {
      // 静默：beacon 失败不应打扰用户
    })
  }, [pathname])

  return null
}
