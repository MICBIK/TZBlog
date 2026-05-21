import { env } from "@/lib/env"

export const SITE_META = {
  name: "TZBlog",
  description: "A developer who builds things and writes about them.",
  author: "HaiDen",
  baseUrl: env.SITE_URL,
} as const

export function absoluteUrl(path: string): string {
  const base = SITE_META.baseUrl.replace(/\/+$/, "")
  const normalized = path.startsWith("/") ? path : `/${path}`
  return `${base}${normalized}`
}
