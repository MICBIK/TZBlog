import { NextResponse } from "next/server"

import { ok, withErrorHandler } from "@/lib/api-response"
import { auth } from "@/lib/auth"
import { errors } from "@/lib/errors"
import { commentBulkUpdateSchema } from "@/lib/schemas/comment"
import { bulkUpdateCommentStatus } from "@/lib/services/comments"

async function requireAdminSession() {
  const session = await auth()
  if (!session?.user?.id) {
    throw errors.unauthorized()
  }
  return session
}

export const POST = withErrorHandler(
  async (req: Request): Promise<NextResponse> => {
    const session = await requireAdminSession()
    const body = (await req.json()) as unknown
    const input = commentBulkUpdateSchema.parse(body)
    const result = await bulkUpdateCommentStatus(
      input.ids,
      input.status,
      session.user.id,
    )
    return ok(result)
  },
)
