"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

/**
 * <CommentForm> — D3 评论提交表单。
 *
 * 字段：authorName / authorEmail / authorWebsite (optional) / content
 * 提交：POST `/api/posts/[slug]/comments` with optional `parentId` (reply mode)
 * 状态：
 *   - success → 显示「评论已提交，等待审核」+ 表单清空 + onSuccess?.()
 *   - 429 → 显示「评论太频繁，请稍后再试」（保留表单内容）
 *   - 其他错误 → fallback 文案
 *
 * 表单层用独立 schema（接受空字符串 authorWebsite），onSubmit 时转换为
 * undefined 再走服务端 commentCreateSchema 严格校验。
 */

const formSchema = z.object({
  authorName: z.string().min(1, "请输入昵称").max(60),
  authorEmail: z.string().email("邮箱格式不正确"),
  authorWebsite: z.union([z.string().url("URL 格式不正确"), z.literal("")]),
  content: z.string().min(1, "请输入评论内容").max(1000),
})

type FormValues = z.infer<typeof formSchema>

interface CommentFormProps {
  slug: string
  parentId?: string
  onSuccess?: () => void
}

type SubmitStatus = "idle" | "success" | "rateLimited" | "error"

export function CommentForm({ slug, parentId, onSuccess }: CommentFormProps) {
  const [status, setStatus] = useState<SubmitStatus>("idle")
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      authorName: "",
      authorEmail: "",
      authorWebsite: "",
      content: "",
    },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    setStatus("idle")
    const body: Record<string, unknown> = {
      authorName: values.authorName,
      authorEmail: values.authorEmail,
      content: values.content,
    }
    if (values.authorWebsite) body.authorWebsite = values.authorWebsite
    if (parentId) body.parentId = parentId

    let res: Response
    try {
      res = await fetch(
        `/api/posts/${encodeURIComponent(slug)}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      )
    } catch {
      setStatus("error")
      return
    }

    if (res.status === 201) {
      setStatus("success")
      form.reset()
      onSuccess?.()
      return
    }
    if (res.status === 429) {
      setStatus("rateLimited")
      return
    }
    setStatus("error")
  })

  const submitting = form.formState.isSubmitting
  const errors = form.formState.errors

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block">
        <span className="block text-xs font-mono text-muted-fg">昵称</span>
        <input
          {...form.register("authorName")}
          className="mt-1 w-full rounded-md border border-border bg-bg px-3 py-2 text-sm"
          aria-invalid={Boolean(errors.authorName)}
        />
        {errors.authorName && (
          <span className="mt-1 block text-xs text-red-600">
            {errors.authorName.message}
          </span>
        )}
      </label>

      <label className="block">
        <span className="block text-xs font-mono text-muted-fg">邮箱</span>
        <input
          type="email"
          {...form.register("authorEmail")}
          className="mt-1 w-full rounded-md border border-border bg-bg px-3 py-2 text-sm"
          aria-invalid={Boolean(errors.authorEmail)}
        />
        {errors.authorEmail && (
          <span className="mt-1 block text-xs text-red-600">
            {errors.authorEmail.message}
          </span>
        )}
      </label>

      <label className="block">
        <span className="block text-xs font-mono text-muted-fg">
          主页（选填）
        </span>
        <input
          {...form.register("authorWebsite")}
          placeholder="https://..."
          className="mt-1 w-full rounded-md border border-border bg-bg px-3 py-2 text-sm"
          aria-invalid={Boolean(errors.authorWebsite)}
        />
        {errors.authorWebsite && (
          <span className="mt-1 block text-xs text-red-600">
            {errors.authorWebsite.message}
          </span>
        )}
      </label>

      <label className="block">
        <span className="block text-xs font-mono text-muted-fg">内容</span>
        <textarea
          {...form.register("content")}
          rows={4}
          className="mt-1 w-full rounded-md border border-border bg-bg px-3 py-2 text-sm"
          aria-invalid={Boolean(errors.content)}
        />
        {errors.content && (
          <span className="mt-1 block text-xs text-red-600">
            {errors.content.message}
          </span>
        )}
      </label>

      <button
        type="submit"
        disabled={submitting}
        className="rounded-full border border-border px-4 py-2 font-mono text-xs transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? "提交中…" : "提交评论"}
      </button>

      {status === "success" && (
        <p role="status" className="text-sm text-fg">
          评论已提交，等待审核
        </p>
      )}
      {status === "rateLimited" && (
        <p role="alert" className="text-sm text-red-600">
          评论太频繁，请稍后再试
        </p>
      )}
      {status === "error" && (
        <p role="alert" className="text-sm text-red-600">
          提交失败，请稍后再试
        </p>
      )}
    </form>
  )
}
