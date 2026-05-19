import { NextResponse } from "next/server"

import { ok, withErrorHandler } from "@/lib/api-response"
import { errors } from "@/lib/errors"
import { auth } from "@/lib/auth"
import { deleteMedia } from "@/lib/services/media"

type RouteContext = { params: Promise<{ id: string }> }

async function requireAdminSession() {
  const session = await auth()
  if (!session?.user) {
    throw errors.unauthorized()
  }
  return session
}

export const DELETE = withErrorHandler(
  async (_req: Request, ctx: RouteContext): Promise<NextResponse> => {
    await requireAdminSession()
    const { id } = await ctx.params
    await deleteMedia(id)
    return ok({ id })
  },
)