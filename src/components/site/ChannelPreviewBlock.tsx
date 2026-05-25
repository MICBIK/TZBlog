import type { HomeChannelPreview } from "@/lib/services/homePage";

export function ChannelPreviewBlock({ channel }: { channel: HomeChannelPreview }) {
  return (
    <section aria-labelledby={`channel-preview-${channel.slug}`} data-testid={`channel-preview-${channel.slug}`} className="space-y-5">
      <h2 id={`channel-preview-${channel.slug}`} className="font-serif text-h3 text-fg">{channel.name}</h2>
    </section>
  );
}
