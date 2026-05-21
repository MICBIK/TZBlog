import { z } from "zod"

/**
 * Track payload schema — `/api/track` 请求体。
 *
 * Stub: TDD RED 阶段，空对象通过任意 payload，由后续 GREEN 收紧。
 */
export const trackPayloadSchema = z.object({})

export type TrackPayloadInput = z.infer<typeof trackPayloadSchema>
