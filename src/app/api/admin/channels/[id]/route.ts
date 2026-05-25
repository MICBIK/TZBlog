import { NextResponse } from "next/server"

import { ok, withErrorHandler } from "@/lib/api-response"
import { auth } from "@/lib/auth"
import { errors } from "@/lib/errors"
import { updateChannelSchema } from "@/lib/schemas/channel"
import { updateChannel } from "@/lib/services/channels"

type RouteContext = { params: Promise<{ id: string }> }

async function requireAdminSession() {
  const session = await auth()
  if (!session?.user) {
    throw errors.unauthorized()
  }
  return session
}

export const PATCH = withErrorHandler(
  async (req: Request, ctx: RouteContext): Promise<NextResponse> => {
    await requireAdminSession()
    const { id } = await ctx.params
    const body = await req.json()
    const input = updateChannelSchema.parse(body)
    const channel = await updateChannel(id, input)
    return ok(channel)
  },
)
