import type { ChannelKind, Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n";
import { parseSiteConfigHero, type SiteConfigHero } from "@/lib/schemas/siteConfigMetadata";

const channelPreviewInclude = {
  translations: { orderBy: { locale: "asc" as const } },
  entries: {
    where: { status: "PUBLISHED" as const },
    orderBy: [
      { publishedAt: { sort: "desc" as const, nulls: "last" as const } },
      { createdAt: "desc" as const },
    ],
    take: 5,
    include: {
      translations: { orderBy: { locale: "asc" as const } },
    },
  },
} satisfies Prisma.ChannelInclude;


export interface HomePreviewEntry {
  id: string;
  slug: string;
  kind: string;
  title: string;
  excerpt: string | null;
  publishedAt: Date | null;
}

export interface HomeChannelPreview {
  id: string;
  slug: string;
  kind: ChannelKind;
  name: string;
  tagline: string | null;
  entries: HomePreviewEntry[];
}

export interface HomeTrendingItem {
  id: string;
  slug: string;
  kind: string;
  title: string;
  channelSlug: string;
  channelName: string;
  trendingScore: number;
  publishedAt: Date | null;
}

export interface HomePageData {
  hero: SiteConfigHero;
  channels: HomeChannelPreview[];
  trending: HomeTrendingItem[];
}

import { previewLimitForKind } from "./homePageLogic";

export { previewLimitForKind } from "./homePageLogic";

function pickTranslation<T extends { locale: string }>(
  rows: readonly T[],
  locale: Locale,
): T | undefined {
  return (
    rows.find((row) => row.locale === locale) ??
    rows.find((row) => row.locale === DEFAULT_LOCALE) ??
    rows[0]
  );
}

export async function getHomePageData(
  locale: Locale = DEFAULT_LOCALE,
): Promise<HomePageData> {
  const [siteConfig, channels] = await Promise.all([
      db.siteConfig.findUnique({ where: { id: "singleton" } }),
      db.channel.findMany({
        where: { enabled: true, kind: { not: "GUESTBOOK" } },
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        include: channelPreviewInclude,
      }),
    ]);

  const hero = parseSiteConfigHero(siteConfig?.metadata);
  return {
    hero,
    channels: channels.map((channel) => {
      const translation = pickTranslation(channel.translations, locale);
      const limit = previewLimitForKind(channel.kind);

      return {
        id: channel.id,
        slug: channel.slug,
        kind: channel.kind,
        name: translation?.name ?? channel.slug,
        tagline: translation?.tagline ?? null,
        entries: channel.entries.slice(0, limit).map((entry) => {
          const entryTr = pickTranslation(entry.translations, locale);
          return {
            id: entry.id,
            slug: entry.slug,
            kind: entry.kind,
            title: entryTr?.title ?? entry.slug,
            excerpt: entryTr?.excerpt ?? null,
            publishedAt: entry.publishedAt,
          };
        }),
      };
    }),
    trending: [],
  };
}
