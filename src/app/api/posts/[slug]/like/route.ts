import { NextResponse } from "next/server"

import { withErrorHandler } from "@/lib/api-response"

/**
 * Likes API — 永久 unique 一次性点赞（D3）。
 * POST: 计入访客点赞；幂等
 * GET: 返回该访客的 liked 状态 + 当前 likeCount
 *
 * Stub: TDD RED 阶段，签名占位。
 */

type RouteContext = { params: Promise<{ slug: string }> }

export const POST = withErrorHandler(
  async (req: Request, ctx: RouteContext): Promise<NextResponse> => {
    const { slug } = await ctx.params
    throw new Error(`not implemented: POST /like for ${slug} (req ${req.method})`)
  },
)

export const GET = withErrorHandler(
  async (req: Request, ctx: RouteContext): Promise<NextResponse> => {
    const { slug } = await ctx.params
    throw new Error(`not implemented: GET /like for ${slug} (req ${req.method})`)
  },
)
