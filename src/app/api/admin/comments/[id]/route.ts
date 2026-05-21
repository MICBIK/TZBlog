import { NextResponse } from "next/server"

import { ok, withErrorHandler } from "@/lib/api-response"
import { auth } from "@/lib/auth"
import { errors } from "@/lib/errors"
import { commentStatusUpdateSchema } from "@/lib/schemas/comment"
import {
  deleteComment,
  updateCommentStatus,
} from "@/lib/services/comments"

type RouteContext = { params: Promise<{ id: string }> }

async function requireAdminSession() {
  const session = await auth()
  if (!session?.user?.id) {
    throw errors.unauthorized()
  }
  return session
}

export const PATCH = withErrorHandler(
  async (req: Request, ctx: RouteContext): Promise<NextResponse> => {
    const session = await requireAdminSession()
    const { id } = await ctx.params
    const body = (await req.json()) as unknown
    const input = commentStatusUpdateSchema.parse(body)
    const result = await updateCommentStatus(id, input.status, session.user.id)
    return ok(result)
  },
)

export const DELETE = withErrorHandler(
  async (_req: Request, ctx: RouteContext): Promise<NextResponse> => {
    await requireAdminSession()
    const { id } = await ctx.params
    await deleteComment(id)
    return ok({ id })
  },
)
