import { z } from "zod"

import { errors } from "@/lib/errors"

// ─── schemas ─────────────────────────────────────────────────────────────────

export const mediaFilterSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(12),
})
export type MediaFilterInput = z.infer<typeof mediaFilterSchema>

// ─── upload validation ────────────────────────────────────────────────────────

const MAX_SIZE = 5 * 1024 * 1024

const ALLOWED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
])

function sniffMime(buf: Buffer): string | null {
  if (buf.length < 4) return null
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47)
    return "image/png"
  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg"
  // GIF: GIF8
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38)
    return "image/gif"
  // WEBP: RIFF....WEBP
  if (
    buf.length >= 12 &&
    buf.toString("ascii", 0, 4) === "RIFF" &&
    buf.toString("ascii", 8, 12) === "WEBP"
  )
    return "image/webp"
  return null
}

export async function validateUpload(input: {
  body: Buffer
  contentType: string
  size: number
}): Promise<void> {
  if (input.size > MAX_SIZE) {
    throw errors.payloadTooLarge("文件超过 5MB 上限")
  }

  if (!ALLOWED_MIME.has(input.contentType)) {
    throw errors.validation("不支持的文件类型，仅限 PNG/JPEG/WEBP/GIF")
  }

  const sniffed = sniffMime(input.body)
  if (!sniffed || !ALLOWED_MIME.has(sniffed)) {
    throw errors.validation("文件类型与扩展名不符，请上传真实的图片文件")
  }
}
