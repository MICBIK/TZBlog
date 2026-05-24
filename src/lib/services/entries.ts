import { db } from "@/lib/db"

export type TrendingEntryListItem = {
  id: string
  slug: string
  trendingScore: number
  publishedAt: Date | null
}

export async function listTrendingEntries(
  limit: number,
): Promise<TrendingEntryListItem[]> {
  return db.entry.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ trendingScore: "desc" }, { publishedAt: "desc" }],
    take: limit,
    select: {
      id: true,
      slug: true,
      trendingScore: true,
      publishedAt: true,
    },
  })
}
