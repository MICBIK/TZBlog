import { NextResponse } from "next/server"

import { ok, withErrorHandler } from "@/lib/api-response"
import { auth } from "@/lib/auth"
import { errors } from "@/lib/errors"
import { getCurrentLocale } from "@/lib/i18n"
import {
  createPostSchema,
  postFilterSchema,
} from "@/lib/schemas/post"
import { createPost, listPosts } from "@/lib/services/posts"

/**
 * Admin post collection API.
 *
 * Auth: `src/proxy.ts` already guards `/api/admin/*`, but we re-check the
 * session in-handler as defense-in-depth. The check also gives us
 * `session.user.id` for `createPost`'s `authorId`.
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
    const filter = postFilterSchema.parse(
      Object.fromEntries(url.searchParams.entries()),
    )
    const result = await listPosts(filter, getCurrentLocale())
    return ok(result.items, {
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
    })
  },
)

export const POST = withErrorHandler(
  async (req: Request): Promise<NextResponse> => {
    const session = await requireAdminSession()
    const body = await req.json()
    const input = createPostSchema.parse(body)
    const post = await createPost(input, session.user.id)
    return ok(post)
  },
)
