import { NextResponse } from "next/server"

import { ok, withErrorHandler } from "@/lib/api-response"
import { errors } from "@/lib/errors"
import { auth } from "@/lib/auth"
import { reorderColumnsSchema } from "@/lib/schemas/column"
import { reorderColumns } from "@/lib/services/columns"

/**
 * Admin column reorder API. Body shape: `{ ids: string[] }` where the column
 * at index `i` receives `order = i`.
 */

async function requireAdminSession() {
  const session = await auth()
  if (!session?.user) {
    throw errors.unauthorized()
  }
  return session
}

export const POST = withErrorHandler(
  async (req: Request): Promise<NextResponse> => {
    await requireAdminSession()
    const body = await req.json()
    const input = reorderColumnsSchema.parse(body)
    await reorderColumns(input.ids)
    return ok({ count: input.ids.length })
  },
)
