import { NextResponse } from "next/server"

import { ok, withErrorHandler } from "@/lib/api-response"
import { errors } from "@/lib/errors"
import { addLike, hasLikedBy } from "@/lib/services/likes"
import { getPostBySlug } from "@/lib/services/posts"
import { getVisitorHash } from "@/lib/visitor"

/**
 * Likes API — 永久 unique 一次性点赞（D3）。
 *
 * - POST: 调 `addLike(slug, visitorHash)` 写入计入（幂等）；missing slug → 404
 * - GET: 返回 `{ liked, likeCount }`；missing slug → 404
 *
 * 访客身份均通过 `getVisitorHash(req)` 计算（IP + UA + daily salt）。
 */

type RouteContext = { params: Promise<{ slug: string }> }

export const POST = withErrorHandler(
  async (req: Request, ctx: RouteContext): Promise<NextResponse> => {
    const { slug } = await ctx.params
    const visitorHash = getVisitorHash(req)
    const result = await addLike(slug, visitorHash)
    return ok(result)
  },
)

export const GET = withErrorHandler(
  async (req: Request, ctx: RouteContext): Promise<NextResponse> => {
    const { slug } = await ctx.params
    const post = await getPostBySlug(slug)
    if (!post) {
      throw errors.notFound(`Post with slug "${slug}" not found`)
    }
    const visitorHash = getVisitorHash(req)
    const liked = await hasLikedBy(slug, visitorHash)
    return ok({ liked, likeCount: post.likeCount })
  },
)
