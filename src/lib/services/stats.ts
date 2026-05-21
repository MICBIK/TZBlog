import { db } from "@/lib/db"

export type SiteStats = {
  views: number
  posts: number
  comments: number
}

export async function getSiteStats(): Promise<SiteStats> {
  const [postStats, comments] = await Promise.all([
    db.post.aggregate({
      where: { status: "PUBLISHED" },
      _sum: { viewCount: true },
      _count: { _all: true },
    }),
    db.comment.count({ where: { status: "APPROVED" } }),
  ])

  return {
    views: postStats._sum.viewCount ?? 0,
    posts: postStats._count._all,
    comments,
  }
}
