import { notFound } from "next/navigation";

import { EntryEditor } from "@/components/admin/entries/EntryEditor";
import { DEFAULT_LOCALE, getCurrentLocale } from "@/lib/i18n";
import { listChannels } from "@/lib/services/channels";

type Props = {
  searchParams: Promise<{
    channelId?: string;
  }>;
};

export default async function NewEntryPage({ searchParams }: Props) {
  const { channelId } = await searchParams;
  const locale = getCurrentLocale();
  const channels = await listChannels();
  const options = channels
    .filter((channel) => channel.enabled)
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

  return <EntryEditor channels={options} initialChannelId={channelId} />;
}
