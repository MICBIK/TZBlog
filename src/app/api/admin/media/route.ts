import { NextResponse } from "next/server"

import { ok, withErrorHandler } from "@/lib/api-response"
import { errors } from "@/lib/errors"
import { auth } from "@/lib/auth"
import { mediaFilterSchema } from "@/lib/schemas/media"
import { listMedia } from "@/lib/services/media"

async function requireAdminSession() {
  const session = await auth()
  if (!session?.user) {
    throw errors.unauthorized()
  }
  return session
}

export const GET = withErrorHandler(
  async (req: Request): Promise<NextResponse> => {
    await requireAdminSession()

    const params = Object.fromEntries(new URL(req.url).searchParams)
    const filter = mediaFilterSchema.parse(params)
    const result = await listMedia(filter)

    return ok(result.items, {
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
    })
  },
)