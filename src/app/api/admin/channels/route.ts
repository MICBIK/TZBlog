import { NextResponse } from "next/server"

import { ok, withErrorHandler } from "@/lib/api-response"
import { auth } from "@/lib/auth"
import { errors } from "@/lib/errors"
import { getCurrentLocale } from "@/lib/i18n"
import { createChannelSchema } from "@/lib/schemas/channel"
import { createChannel, listChannels } from "@/lib/services/channels"

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

function normalizeCreateChannelBody(body: unknown) {
  const raw =
    typeof body === "object" && body !== null
      ? (body as Record<string, unknown>)
      : {}
  const slug = typeof raw.slug === "string" ? raw.slug : ""

  return createChannelSchema.parse({
    ...raw,
    enabled: raw.enabled ?? true,
    translations: raw.translations ?? [
      {
        locale: getCurrentLocale(),
        name: slug,
        description: null,
      },
    ],
  })
}

export const POST = withErrorHandler(async (req: Request): Promise<NextResponse> => {
  await requireAdminSession()
  const body = await req.json()
  const input = normalizeCreateChannelBody(body)
  const channel = await createChannel(input)
  return ok(channel)
})
