import { NextResponse } from "next/server"

import { ok, withErrorHandler } from "@/lib/api-response"
import { errors } from "@/lib/errors"
import { auth } from "@/lib/auth"

async function requireAdminSession() {
  const session = await auth()
  if (!session?.user) {
    throw errors.unauthorized()
  }
  return session
}

export const POST = withErrorHandler(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async (_req: Request): Promise<NextResponse> => {
    await requireAdminSession()
    return ok({})
  },
)