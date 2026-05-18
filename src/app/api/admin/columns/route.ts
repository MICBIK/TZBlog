import { NextResponse } from "next/server"

import { ok, withErrorHandler } from "@/lib/api-response"
import { errors } from "@/lib/errors"
import { auth } from "@/lib/auth"
import { createColumnSchema } from "@/lib/schemas/column"
import { createColumn, listColumns } from "@/lib/services/columns"

/**
 * Admin column collection API.
 *
 * Auth: `middleware.ts` already guards `/api/admin/*`, but we re-check the
 * session in-handler as a defense-in-depth (covers direct service tests and
 * any future middleware regressions).
 */

async function requireAdminSession() {
  const session = await auth()
  if (!session?.user) {
    throw errors.unauthorized()
  }
  return session
}

export const GET = withErrorHandler(async (): Promise<NextResponse> => {
  await requireAdminSession()
  const columns = await listColumns()
  return ok(columns)
})

export const POST = withErrorHandler(
  async (req: Request): Promise<NextResponse> => {
    await requireAdminSession()
    const body = await req.json()
    const input = createColumnSchema.parse(body)
    const column = await createColumn(input)
    return ok(column)
  },
)
