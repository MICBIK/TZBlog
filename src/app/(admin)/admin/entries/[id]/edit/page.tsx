import { notFound } from "next/navigation";
import type { EntryKind } from "@prisma/client";

import { EntryEditor } from "@/components/admin/entries/EntryEditor";
import { DEFAULT_LOCALE, getCurrentLocale } from "@/lib/i18n";
import { listChannels } from "@/lib/services/channels";
import { getEntryById } from "@/lib/services/entries";
import { listSeriesOptions } from "@/lib/services/series";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditEntryPage({ params }: Props) {
  const { id } = await params;
  const locale = getCurrentLocale();
  const [entry, channels, seriesOptions] = await Promise.all([
    getEntryById(id),
    listChannels(),
    listSeriesOptions(locale),
  ]);

  if (!entry) {
    notFound();
  }

  const options = channels
    .filter((channel) => channel.enabled && channel.kind !== "GUESTBOOK")
    .map((channel) => {
      const translation =
        channel.translations.find((row) => row.locale === locale) ??
        channel.translations.find((row) => row.locale === DEFAULT_LOCALE) ??
        channel.translations[0];

      return {
        id: channel.id,
        slug: channel.slug,
        kind: channel.kind,
        name: translation?.name ?? channel.slug,
      };
    });

  const translation =
    entry.translations.find((row) => row.locale === locale) ??
    entry.translations.find((row) => row.locale === DEFAULT_LOCALE) ??
    entry.translations[0];

  return (
    <EntryEditor
      mode="edit"
      initialChannelId={entry.channelId}
      channels={options}
      seriesOptions={seriesOptions}
      initial={{
        id: entry.id,
        slug: entry.slug,
        channelId: entry.channelId,
        kind: entry.kind as EntryKind,
        status: entry.status,
        publishedAt: entry.publishedAt ? entry.publishedAt.toISOString() : null,
        title: translation?.title ?? "",
        excerpt: translation?.excerpt ?? "",
        content: translation?.content ?? "",
        tags: entry.tags.map((row) => row.tag.slug),
        seriesId: entry.seriesId,
        seriesOrder: entry.seriesOrder,
        metadata: entry.metadata,
      }}
    />
  );
}
