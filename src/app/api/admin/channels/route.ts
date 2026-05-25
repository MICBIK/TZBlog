import { NextResponse } from "next/server"

import { ok, withErrorHandler } from "@/lib/api-response"
import { auth } from "@/lib/auth"
import { errors } from "@/lib/errors"
import { listChannels } from "@/lib/services/channels"

async function requireAdminSession() {
  const session = await auth()
  if (!session?.user) {
    throw errors.unauthorized()
  }
  return session
}

export const GET = withErrorHandler(async (): Promise<NextResponse> => {
  await requireAdminSession()
  const channels = await listChannels()
  return ok(channels)
})

export const POST = withErrorHandler(async (): Promise<NextResponse> => {
  await requireAdminSession()
  return ok({ id: "placeholder" })
})
