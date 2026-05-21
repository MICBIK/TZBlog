import { z } from "zod"

/**
 * Track payload schema — `POST /api/track` 请求体。
 *
 * - `path`: SPA 路径，必须 `/` 开头，max 500 字符
 * - `referrer`: 可选；接受空字符串（document.referrer 可能空）或合法 URL，max 500
 */
export const trackPayloadSchema = z.object({
  path: z
    .string()
    .min(1, "path 不能为空")
    .max(500, "path 超过 500 字符")
    .refine((v) => v.startsWith("/"), "path 必须以 / 开头"),
  referrer: z
    .union([
      z.string().url("referrer 必须是合法 URL").max(500, "referrer 超过 500 字符"),
      z.literal(""),
    ])
    .optional(),
})

export type TrackPayloadInput = z.infer<typeof trackPayloadSchema>
