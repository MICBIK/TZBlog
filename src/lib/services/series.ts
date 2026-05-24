import { db } from "@/lib/db"

export type SeriesEntryListItem = {
  id: string
  slug: string
  seriesOrder: number | null
  publishedAt: Date | null
}

export async function listSeriesEntries(
  seriesId: string,
): Promise<SeriesEntryListItem[]> {
  return db.entry.findMany({
    where: {
      seriesId,
      status: "PUBLISHED",
    },
    orderBy: [{ seriesOrder: "asc" }, { publishedAt: "asc" }],
    select: {
      id: true,
      slug: true,
      seriesOrder: true,
      publishedAt: true,
    },
  })
}
