import { z } from "zod"

/**
 * Comment schemas — 前后端共享（systemPatterns §6）。
 *
 * 前台 (D3): commentCreateSchema 用户提交评论
 * 后台 (C):
 *   - commentFilterSchema: 列表查询参数
 *   - commentStatusUpdateSchema: 单条状态更新
 *   - commentBulkUpdateSchema: 批量状态更新
 *
 * - `authorName` / `authorEmail` 必填，反垃圾的最低门槛
 * - `content` 长度上限 1000，避免大文本攻击 / DB 压力
 * - `authorWebsite` 可选 URL（评论者主页）
 * - `parentId` 可选；存在时由 service 层校验 parent 真实且 depth ≤ 1
 *
 * 与表单层共享：react-hook-form + zodResolver 使用同一份 schema。
 */

export const commentStatusEnum = z.enum([
  "PENDING",
  "APPROVED",
  "SPAM",
  "REJECTED",
])
export type CommentStatusInput = z.infer<typeof commentStatusEnum>

export const commentCreateSchema = z.object({
  authorName: z.string().min(1).max(60),
  authorEmail: z.string().email(),
  authorWebsite: z.string().url().optional(),
  content: z.string().min(1).max(1000),
  parentId: z.string().min(1).optional(),
})

export type CommentCreateInput = z.infer<typeof commentCreateSchema>

export const commentFilterSchema = z.object({
  status: commentStatusEnum.optional(),
  postId: z.string().min(1).optional(),
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
})

export type CommentFilterInput = z.infer<typeof commentFilterSchema>

export const commentStatusUpdateSchema = z.object({
  status: commentStatusEnum,
})

export type CommentStatusUpdateInput = z.infer<typeof commentStatusUpdateSchema>

export const commentBulkUpdateSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
  status: commentStatusEnum,
})

export type CommentBulkUpdateInput = z.infer<typeof commentBulkUpdateSchema>
