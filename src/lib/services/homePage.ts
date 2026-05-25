import type { ChannelKind } from "@prisma/client";

import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n";
import type { SiteConfigHero } from "@/lib/schemas/siteConfigMetadata";

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

export async function getHomePageData(
  locale: Locale = DEFAULT_LOCALE,
): Promise<HomePageData> {
  void locale;
  throw new Error("not implemented");
}
