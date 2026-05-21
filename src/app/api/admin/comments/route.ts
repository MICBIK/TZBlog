import { NextResponse } from "next/server"

import { withErrorHandler } from "@/lib/api-response"

/**
 * Admin comments collection API.
 * Stub: TDD RED 阶段，待 GREEN 阶段填充 GET (list + filter).
 */

export const GET = withErrorHandler(
  async (req: Request): Promise<NextResponse> => {
    throw new Error(`not implemented: GET /api/admin/comments (req ${req.method})`)
  },
)
