import { NextResponse } from "next/server"

import { ok, withErrorHandler } from "@/lib/api-response"
import { errors } from "@/lib/errors"
import { auth } from "@/lib/auth"
import { validateUpload } from "@/lib/schemas/media"
import { createMedia } from "@/lib/services/media"

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

    const buf = Buffer.from(await file.arrayBuffer())
    await validateUpload({
      body: buf,
      contentType: file.type,
      size: buf.length,
    })

    const media = await createMedia({
      filename: file.name,
      mimeType: file.type,
      body: buf,
      size: buf.length,
      uploadedBy: (session.user as { id: string }).id,
    })

    return ok(media)
  },
)