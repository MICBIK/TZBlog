import { db } from "@/lib/db"
import { DEFAULT_LOCALE } from "@/lib/i18n"

export type SeriesEntryListItem = {
  id: string
  slug: string
  seriesOrder: number | null
  publishedAt: Date | null
}

export type SeriesOption = {
  id: string
  channelId: string
  name: string
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

export async function listSeriesOptions(
  locale: string,
): Promise<SeriesOption[]> {
  const rows = await db.series.findMany({
    orderBy: [{ createdAt: "asc" }],
    include: {
      translations: { orderBy: { locale: "asc" } },
    },
  })

  return rows.map((series) => {
    const translation =
      series.translations.find((row) => row.locale === locale) ??
      series.translations.find((row) => row.locale === DEFAULT_LOCALE) ??
      series.translations[0]

    return {
      id: series.id,
      channelId: series.channelId,
      name: translation?.name ?? series.slug,
    }
  })
}
