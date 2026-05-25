import { NextResponse } from "next/server"

import { ok, withErrorHandler } from "@/lib/api-response"
import { errors } from "@/lib/errors"
import { checkRateLimit } from "@/lib/rate-limit"
import { commentCreateSchema } from "@/lib/schemas/comment"
import {
  createComment,
  listApprovedComments,
} from "@/lib/services/comments"
import { getArticleBySlug } from "@/lib/services/articles"
import { getClientIp, getVisitorHash } from "@/lib/visitor"

/**
 * Comments API — D3。
 *
 * - POST: rate-limit 5min/3 by visitorHash → zod.parse → createComment（PENDING）→ 201
 * - GET: 查 post.id by slug → listApprovedComments → ok({comments})；missing slug → 404
 *
 * 反垃圾：rate-limit key 用 `comment:<visitorHash>`，窗口 5 分钟。
 * 服务端审核流转见审核页 epic（C），D3 仅做提交与展示。
 */

type RouteContext = { params: Promise<{ slug: string }> }

export const POST = withErrorHandler(
  async (req: Request, ctx: RouteContext): Promise<NextResponse> => {
    const { slug } = await ctx.params
    const visitorHash = getVisitorHash(req)

    const rl = checkRateLimit(`comment:${visitorHash}`, 3, 5 * 60_000)
    if (!rl.allowed) {
      throw errors.rateLimited("评论太频繁，请稍后再试")
    }

    const raw = (await req.json()) as unknown
    const input = commentCreateSchema.parse(raw)

    const result = await createComment({
      slug,
      authorName: input.authorName,
      authorEmail: input.authorEmail,
      authorWebsite: input.authorWebsite,
      content: input.content,
      parentId: input.parentId,
      visitorHash,
      ipAddress: getClientIp(req),
      userAgent: req.headers.get("user-agent") ?? "",
    })

    return NextResponse.json({ data: result }, { status: 201 })
  },
)

export const GET = withErrorHandler(
  async (_req: Request, ctx: RouteContext): Promise<NextResponse> => {
    const { slug } = await ctx.params
    const post = await getArticleBySlug(slug)
    if (!post) {
      throw errors.notFound(`Post with slug "${slug}" not found`)
    }
    const comments = await listApprovedComments(post.id)
    return ok({ comments })
  },
)
