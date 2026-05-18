import { NextResponse } from "next/server"

import { ok, withErrorHandler } from "@/lib/api-response"
import { auth } from "@/lib/auth"
import { errors } from "@/lib/errors"
import { createTagSchema, tagFilterSchema } from "@/lib/schemas/tag"
import { listTags, upsertTagsBySlug } from "@/lib/services/tags"

/**
 * Admin tag API.
 *
 * `GET` powers the tag picker / autocomplete in the post form.
 * `POST` is a thin wrapper around `upsertTagsBySlug` for the rare case where
 * the admin wants to pre-create a tag without an attached post.
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
    const filter = tagFilterSchema.parse(
      Object.fromEntries(url.searchParams.entries()),
    )
    const tags = await listTags(filter)
    return ok(tags)
  },
)

export const POST = withErrorHandler(
  async (req: Request): Promise<NextResponse> => {
    await requireAdminSession()
    const body = await req.json()
    const input = createTagSchema.parse(body)
    const [tag] = await upsertTagsBySlug([input])
    return ok(tag)
  },
)
