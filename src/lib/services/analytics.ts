import { db } from "@/lib/db"
import { parseUserAgent } from "@/lib/visitor"

/**
 * Analytics service — PageView 入库。
 *
 * recordPageView(input):
 *   - 用 parseUserAgent(ua) 拆 device / browser / os
 *   - insert PageView 行
 *   - 不去重（R11 决策），rate-limit 在 API 层兜底
 *
 * referrer 处理：空字符串与省略都归一化为 null（与 form 层 union 对齐）
 */

export interface RecordPageViewInput {
  path: string
  visitorHash: string
  ua: string
  referrer?: string
}

export async function recordPageView(input: RecordPageViewInput): Promise<void> {
  const { device, browser, os } = parseUserAgent(input.ua)
  await db.pageView.create({
    data: {
      path: input.path,
      visitorHash: input.visitorHash,
      userAgent: input.ua,
      device,
      browser,
      os,
      referrer: input.referrer ? input.referrer : null,
    },
  })
}
