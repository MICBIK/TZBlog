import { NextResponse } from "next/server"

import { withErrorHandler } from "@/lib/api-response"

/**
 * Admin comment item API. Stub: TDD RED 阶段，GREEN 实现 PATCH + DELETE.
 */

type RouteContext = { params: Promise<{ id: string }> }

export const PATCH = withErrorHandler(
  async (req: Request, ctx: RouteContext): Promise<NextResponse> => {
    const { id } = await ctx.params
    throw new Error(`not implemented: PATCH /api/admin/comments/${id} (req ${req.method})`)
  },
)

export const DELETE = withErrorHandler(
  async (req: Request, ctx: RouteContext): Promise<NextResponse> => {
    const { id } = await ctx.params
    throw new Error(`not implemented: DELETE /api/admin/comments/${id} (req ${req.method})`)
  },
)
