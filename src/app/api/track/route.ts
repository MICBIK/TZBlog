import { NextResponse } from "next/server"

import { withErrorHandler } from "@/lib/api-response"

/**
 * Analytics ingest: `POST /api/track`
 *
 * Stub: TDD RED 阶段，签名占位。
 */

export const POST = withErrorHandler(
  async (req: Request): Promise<NextResponse> => {
    throw new Error(`not implemented: POST /api/track (req ${req.method})`)
  },
)
