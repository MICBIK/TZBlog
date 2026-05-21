import { NextResponse } from "next/server"

import { withErrorHandler } from "@/lib/api-response"

/**
 * Admin comments bulk update API. Stub: TDD RED 阶段。
 */

export const POST = withErrorHandler(
  async (req: Request): Promise<NextResponse> => {
    throw new Error(`not implemented: POST /api/admin/comments/bulk (req ${req.method})`)
  },
)
