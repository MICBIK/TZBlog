import type { Locale } from "@/lib/i18n";
import { db } from "@/lib/db";

export interface PublicTagListItem {
  slug: string;
  name: string;
  count: number;
}

export interface PublicTag {
  id: string;
  slug: string;
  name: string;
}

/**
 * `locale` is reserved for future tag i18n. Tag is locale-free in MVP.
 */
export async function listAllTagsWithCount(
  locale: Locale,
): Promise<PublicTagListItem[]> {
  void locale;

  const rows = await db.tag.findMany({
    select: {
      slug: true,
      name: true,
      _count: {
        select: {
          entries: {
            where: { entry: { status: "PUBLISHED" } },
          },
        },
      },
    },
  });

  return rows
    .map((tag) => ({
      slug: tag.slug,
      name: tag.name,
      count: tag._count.entries,
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export async function getTagBySlug(slug: string): Promise<PublicTag | null> {
  return db.tag.findUnique({
    where: { slug },
    select: { id: true, slug: true, name: true },
  });
}
