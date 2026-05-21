import { z } from "zod"

/**
 * Comment schemas — 前后端共享（systemPatterns §6）。
 *
 * Stub: TDD RED 阶段，空对象通过任意 payload；实测在 GREEN 中收紧。
 */

export const commentCreateSchema = z.object({})

export type CommentCreateInput = z.infer<typeof commentCreateSchema>
