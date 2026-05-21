import { NextResponse } from "next/server"

import { withErrorHandler } from "@/lib/api-response"

/**
 * Comments API — D3。
 * POST: rate-limit 5min/3 by visitorHash + zod.parse + createComment（PENDING）
 * GET: 仅 APPROVED + 嵌套 reply
 *
 * Stub: TDD RED 阶段，签名占位。
 */

type RouteContext = { params: Promise<{ slug: string }> }

export const POST = withErrorHandler(
  async (req: Request, ctx: RouteContext): Promise<NextResponse> => {
    const { slug } = await ctx.params
    throw new Error(`not implemented: POST /comments for ${slug} (req ${req.method})`)
  },
)

export const GET = withErrorHandler(
  async (req: Request, ctx: RouteContext): Promise<NextResponse> => {
    const { slug } = await ctx.params
    throw new Error(`not implemented: GET /comments for ${slug} (req ${req.method})`)
  },
)
