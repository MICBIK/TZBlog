import { NextResponse } from "next/server"

import { ok, withErrorHandler } from "@/lib/api-response"
import { auth } from "@/lib/auth"
import { errors } from "@/lib/errors"
import { commentFilterSchema } from "@/lib/schemas/comment"
import { listCommentsForAdmin } from "@/lib/services/comments"

/**
 * Admin comments collection API — list with filter (status / postId / q / pagination).
 * Auth: middleware-level guard + defensive in-handler check.
 */

async function requireAdminSession() {
  const session = await auth()
  if (!session?.user?.id) {
    throw errors.unauthorized()
  }
  return session
}

export const GET = withErrorHandler(
  async (req: Request): Promise<NextResponse> => {
    await requireAdminSession()
    const url = new URL(req.url)
    const filter = commentFilterSchema.parse(
      Object.fromEntries(url.searchParams.entries()),
    )
    const result = await listCommentsForAdmin(filter)
    return ok(result.items, {
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
    })
  },
)
