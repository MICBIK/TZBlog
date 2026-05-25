import { NextResponse } from "next/server"

import { ok, withErrorHandler } from "@/lib/api-response"
import { errors } from "@/lib/errors"
import { checkRateLimit } from "@/lib/rate-limit"
import { incrementArticleView } from "@/lib/services/articles"
import { getDailySalt, getVisitorHash } from "@/lib/visitor"

/**
 * Public post-view ingest. Fire-and-forget from the post detail page; the
 * de-duplication contract lives in the service layer (per systemPatterns §10):
 *
 *   - One PostView row per `(postId, visitorHash, dayKey)`.
 *   - Counter only increments when the row is actually inserted.
 *
 * The route adds an IP/UA-scoped rate limit so a busted client (or an
 * adversary) can't pound the table even on a fresh dayKey.
 */

type RouteContext = { params: Promise<{ slug: string }> }

export const POST = withErrorHandler(
  async (req: Request, ctx: RouteContext): Promise<NextResponse> => {
    const { slug } = await ctx.params
    const visitorHash = getVisitorHash(req)

    // 10 hits / minute per visitor — well above legit reload rates and
    // far below what a script can spam through.
    const rl = checkRateLimit(`view:${visitorHash}`, 10, 60_000)
    if (!rl.allowed) {
      throw errors.rateLimited()
    }

    const dayKey = getDailySalt()
    const result = await incrementArticleView(slug, visitorHash, dayKey)
    return ok(result)
  },
)
