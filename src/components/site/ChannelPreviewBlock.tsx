import Link from "next/link";

import type { HomeChannelPreview } from "@/lib/services/homePage";

function entryHref(channelSlug: string, entrySlug: string, kind: string): string {
  if (kind === "ARTICLE" || kind === "REVIEW") {
    return `/posts/${entrySlug}`;
  }

  return `/c/${channelSlug}#${entrySlug}`;
}

export interface ChannelPreviewBlockProps {
  channel: HomeChannelPreview;
}

export function ChannelPreviewBlock({ channel }: ChannelPreviewBlockProps) {
  return (
    <section
      aria-labelledby={`channel-preview-${channel.slug}`}
      data-testid={`channel-preview-${channel.slug}`}
      className="space-y-5"
    >
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-3">
        <div className="space-y-1">
          <h2
            id={`channel-preview-${channel.slug}`}
            className="font-serif text-h3 tracking-tight text-fg"
          >
            {channel.name}
          </h2>
          {channel.tagline ? (
            <p className="text-sm text-muted-fg">{channel.tagline}</p>
          ) : null}
        </div>
        <Link
          href={`/c/${channel.slug}`}
          className="text-sm font-medium text-accent hover:underline"
        >
          查看全部 →
        </Link>
      </header>

      <ul className="grid gap-4 md:grid-cols-3">
        {channel.entries.map((entry) => (
          <li key={entry.id}>
            <Link
              href={entryHref(channel.slug, entry.slug, entry.kind)}
              className="group block rounded-xl border border-border p-4 transition-colors hover:border-accent"
            >
              <h3 className="font-semibold text-fg group-hover:underline">
                {entry.title}
              </h3>
              {entry.excerpt ? (
                <p className="mt-2 line-clamp-3 text-sm text-muted-fg">
                  {entry.excerpt}
                </p>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
