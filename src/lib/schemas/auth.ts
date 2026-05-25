import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const visitorEmailSchema = z.object({
  email: z.string().email("请输入有效邮箱"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type VisitorEmailInput = z.infer<typeof visitorEmailSchema>;
