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
  async (req: Request): Promise<NextResponse> => {
    const session = await requireAdminSession()

    const fd = await req.formData()
    const file = fd.get("file")
    if (!(file instanceof File)) {
      throw errors.validation("缺少 file 字段")
    }

    return ok({ uploadedBy: (session.user as { id: string }).id })
  },
)