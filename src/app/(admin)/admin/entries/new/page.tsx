import { forbidden, notFound } from "next/navigation";

import { EntryEditor } from "@/components/admin/entries/EntryEditor";
import { DEFAULT_LOCALE, getCurrentLocale } from "@/lib/i18n";
import { listChannels } from "@/lib/services/channels";
import { listSeriesOptions } from "@/lib/services/series";

type Props = {
  searchParams: Promise<{
    channelId?: string;
  }>;
};

export default async function NewEntryPage({ searchParams }: Props) {
  const { channelId } = await searchParams;
  const locale = getCurrentLocale();
  const [channels, seriesOptions] = await Promise.all([
    listChannels(),
    listSeriesOptions(locale),
  ]);
  const enabledChannels = channels.filter((channel) => channel.enabled);
  const requestedChannel = channelId
    ? enabledChannels.find((channel) => channel.id === channelId) ?? null
    : enabledChannels[0] ?? null;

  if (requestedChannel?.kind === "GUESTBOOK") {
    forbidden();
  }

  const options = enabledChannels
    .filter((channel) => channel.kind !== "GUESTBOOK")
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

  if (options.length === 0) {
    notFound();
  }

  const initialOption =
    options.find((channel) => channel.id === channelId) ?? options[0];

  return (
    <EntryEditor
      channels={options}
      seriesOptions={seriesOptions}
      initialChannelId={initialOption?.id}
    />
  );
}
