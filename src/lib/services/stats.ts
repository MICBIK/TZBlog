import { db } from "@/lib/db"

export type SiteStats = {
  views: number
  viewsInLast7Days: number
  posts: number
  comments: number
  lastShippedAt: Date | null
}

const DAY_MS = 24 * 60 * 60 * 1000

export async function getSiteStats(): Promise<SiteStats> {
  const sevenDaysAgo = new Date(Date.now() - 7 * DAY_MS)
  const [postStats, comments, viewsInLast7Days, lastPublishedPost] =
    await Promise.all([
    db.post.aggregate({
      where: { status: "PUBLISHED" },
      _sum: { viewCount: true },
      _count: { _all: true },
    }),
    db.comment.count({ where: { status: "APPROVED" } }),
    db.pageView.count({
      where: {
        createdAt: { gte: sevenDaysAgo },
        AND: [
          { NOT: { path: { startsWith: "/admin" } } },
          { NOT: { path: { startsWith: "/api" } } },
        ],
      },
    }),
    db.post.findFirst({
      where: { status: "PUBLISHED", publishedAt: { not: null } },
      orderBy: [{ publishedAt: "desc" }],
      select: { publishedAt: true },
    }),
  ])

  return {
    views: postStats._sum.viewCount ?? 0,
    viewsInLast7Days,
    posts: postStats._count._all,
    comments,
    lastShippedAt: lastPublishedPost?.publishedAt ?? null,
  }
}
