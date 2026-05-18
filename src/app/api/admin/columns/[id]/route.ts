import { NextResponse } from "next/server"

import { ok, withErrorHandler } from "@/lib/api-response"
import { errors } from "@/lib/errors"
import { auth } from "@/lib/auth"
import { updateColumnSchema } from "@/lib/schemas/column"
import {
  deleteColumn,
  getColumnById,
  updateColumn,
} from "@/lib/services/columns"

/**
 * Admin column item API. Next 15+ App Router exposes `params` as a Promise.
 *
 * Auth: middleware-level guard plus a defensive `auth()` check.
 */

type RouteContext = { params: Promise<{ id: string }> }

async function requireAdminSession() {
  const session = await auth()
  if (!session?.user) {
    throw errors.unauthorized()
  }
  return session
}

export const GET = withErrorHandler(
  async (_req: Request, ctx: RouteContext): Promise<NextResponse> => {
    await requireAdminSession()
    const { id } = await ctx.params
    const column = await getColumnById(id)
    if (!column) throw errors.notFound(`Column ${id} not found`)
    return ok(column)
  },
)

export const PATCH = withErrorHandler(
  async (req: Request, ctx: RouteContext): Promise<NextResponse> => {
    await requireAdminSession()
    const { id } = await ctx.params
    const body = await req.json()
    const input = updateColumnSchema.parse(body)
    const column = await updateColumn(id, input)
    return ok(column)
  },
)

export const DELETE = withErrorHandler(
  async (_req: Request, ctx: RouteContext): Promise<NextResponse> => {
    await requireAdminSession()
    const { id } = await ctx.params
    await deleteColumn(id)
    return ok({ id })
  },
)
