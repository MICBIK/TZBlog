import { z } from "zod"

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

export async function validateUpload(input: {
  body: Buffer
  contentType: string
  size: number
}): Promise<void> {
  void MAX_SIZE
  void ALLOWED_MIME
  void input
  throw new Error("not implemented")
}
