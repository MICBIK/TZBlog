import { createHash } from "crypto"
import type { NextRequest } from "next/server"

export function getDailySalt(date = new Date()): string {
  // YYYY-MM-DD UTC
  return date.toISOString().slice(0, 10)
}

export function getClientIp(req: NextRequest | Request): string {
  const xff = req.headers.get("x-forwarded-for")
  if (xff) return xff.split(",")[0].trim()
  const realIp = req.headers.get("x-real-ip")
  if (realIp) return realIp.trim()
  return "0.0.0.0"
}

export function getVisitorHash(
  req: NextRequest | Request,
  salt = getDailySalt(),
): string {
  const ip = getClientIp(req)
  const ua = req.headers.get("user-agent") ?? ""
  return createHash("sha256").update(`${ip}|${ua}|${salt}`).digest("hex")
}

export function parseUserAgent(ua: string): {
  device: string
  browser: string
  os: string
} {
  const isMobile = /Mobile|Android|iPhone|iPad/i.test(ua)
  const isTablet = /iPad|Tablet/i.test(ua)
  const device = isTablet ? "tablet" : isMobile ? "mobile" : "desktop"

  let browser = "unknown"
  if (/Edg\//.test(ua)) browser = "Edge"
  else if (/Chrome\//.test(ua) && !/Chromium/.test(ua)) browser = "Chrome"
  else if (/Firefox\//.test(ua)) browser = "Firefox"
  else if (/Safari\//.test(ua) && !/Chrome/.test(ua)) browser = "Safari"

  // Order matters: Android UAs contain "Linux", iPad/iPhone UAs contain
  // "Mac OS X". Check the more specific platforms before the generic ones.
  let os = "unknown"
  if (/Windows NT/.test(ua)) os = "Windows"
  else if (/Android/.test(ua)) os = "Android"
  else if (/iPhone|iPad|iPod/.test(ua)) os = "iOS"
  else if (/Mac OS X/.test(ua)) os = "macOS"
  else if (/Linux/.test(ua)) os = "Linux"

  return { device, browser, os }
}
