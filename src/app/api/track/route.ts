import { NextResponse } from "next/server"

import { withErrorHandler } from "@/lib/api-response"
import { errors } from "@/lib/errors"
import { checkRateLimit } from "@/lib/rate-limit"
import { trackPayloadSchema } from "@/lib/schemas/analytics"
import { recordPageView } from "@/lib/services/analytics"
import { getVisitorHash } from "@/lib/visitor"

/**
 * Analytics ingest: `POST /api/track`
 *
 * 防御层（顺序）：
 *   1. DNT 浏览器请求头：尊重 → 204 不入库
 *   2. zod 校验 path / referrer
 *   3. path 黑名单（/admin /api /login）→ 204 不入库
 *   4. rate-limit `analytics:${visitorHash}` 60 次/分钟 → 超限 429
 *   5. recordPageView 入库 → 204 No Content
 *
 * 所有成功路径都返 204（轻量响应，Beacon 不读 body）。
 */

const PATH_BLACKLIST = /^\/(admin|api|login)(\/|$)/

export const POST = withErrorHandler(
  async (req: Request): Promise<NextResponse> => {
    if (req.headers.get("dnt") === "1") {
      return new NextResponse(null, { status: 204 })
    }

    const raw = (await req.json()) as unknown
    const input = trackPayloadSchema.parse(raw)

    if (PATH_BLACKLIST.test(input.path)) {
      return new NextResponse(null, { status: 204 })
    }

    const visitorHash = getVisitorHash(req)

    const rl = checkRateLimit(`analytics:${visitorHash}`, 60, 60_000)
    if (!rl.allowed) {
      throw errors.rateLimited()
    }

    await recordPageView({
      path: input.path,
      visitorHash,
      ua: req.headers.get("user-agent") ?? "",
      referrer: input.referrer,
    })

    return new NextResponse(null, { status: 204 })
  },
)
