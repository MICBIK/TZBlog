import { z } from "zod";

export const guestbookMessageSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "留言不能为空")
    .max(2000, "留言不能超过 2000 字"),
});

export const createGuestbookThreadSchema = guestbookMessageSchema;

export const createGuestbookCommentSchema = z.object({
  threadId: z.string().min(1),
  content: guestbookMessageSchema.shape.content,
});

export type GuestbookMessageInput = z.infer<typeof guestbookMessageSchema>;
export type CreateGuestbookCommentInput = z.infer<
  typeof createGuestbookCommentSchema
>;
