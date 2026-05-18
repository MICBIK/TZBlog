import { NextResponse } from "next/server"

import { ok, withErrorHandler } from "@/lib/api-response"
import { auth } from "@/lib/auth"
import { errors } from "@/lib/errors"
import { updatePostSchema } from "@/lib/schemas/post"
import {
  deletePost,
  getPostById,
  updatePost,
} from "@/lib/services/posts"

/**
 * Admin post item API. Next 15+ App Router exposes `params` as a Promise.
 *
 * Auth: middleware-level guard plus a defensive `auth()` check.
 */

type RouteContext = { params: Promise<{ id: string }> }

async function requireAdminSession() {
  const session = await auth()
  if (!session?.user?.id) {
    throw errors.unauthorized()
  }
  return session
}

export const GET = withErrorHandler(
  async (_req: Request, ctx: RouteContext): Promise<NextResponse> => {
    await requireAdminSession()
    const { id } = await ctx.params
    const post = await getPostById(id)
    if (!post) throw errors.notFound(`Post ${id} not found`)
    return ok(post)
  },
)

export const PATCH = withErrorHandler(
  async (req: Request, ctx: RouteContext): Promise<NextResponse> => {
    await requireAdminSession()
    const { id } = await ctx.params
    const body = await req.json()
    const input = updatePostSchema.parse(body)
    const post = await updatePost(id, input)
    return ok(post)
  },
)

export const DELETE = withErrorHandler(
  async (_req: Request, ctx: RouteContext): Promise<NextResponse> => {
    await requireAdminSession()
    const { id } = await ctx.params
    await deletePost(id)
    return ok({ id })
  },
)
