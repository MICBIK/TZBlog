import { z } from "zod"

/**
 * Comment schemas — 前后端共享（systemPatterns §6）。
 *
 * - `authorName` / `authorEmail` 必填，反垃圾的最低门槛
 * - `content` 长度上限 1000，避免大文本攻击 / DB 压力
 * - `authorWebsite` 可选 URL（评论者主页）
 * - `parentId` 可选；存在时由 service 层校验 parent 真实且 depth ≤ 1
 *
 * 与表单层共享：react-hook-form + zodResolver 使用同一份 schema。
 */

export const commentCreateSchema = z.object({
  authorName: z.string().min(1).max(60),
  authorEmail: z.string().email(),
  authorWebsite: z.string().url().optional(),
  content: z.string().min(1).max(1000),
  parentId: z.string().min(1).optional(),
})

export type CommentCreateInput = z.infer<typeof commentCreateSchema>
