import Link from "next/link";
import { format } from "date-fns";

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
  const cta =
    channel.kind === "STREAM"
      ? { href: `/c/${channel.slug}`, label: "进入流 →" }
      : { href: `/c/${channel.slug}`, label: "查看全部 →" };

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
          href={cta.href}
          className="text-sm font-medium text-accent hover:underline"
        >
          {cta.label}
        </Link>
      </header>

      {channel.kind === "STREAM" ? (
        <ul className="divide-y divide-border border-y border-border font-mono text-sm">
          {channel.entries.map((entry) => (
            <li key={entry.id} className="py-4">
              <Link href={entryHref(channel.slug, entry.slug, entry.kind)} className="group block">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-semibold text-fg group-hover:underline">
                    {entry.title}
                  </span>
                  {entry.publishedAt ? (
                    <time className="text-xs text-muted-fg">
                      {format(entry.publishedAt, "yyyy-MM-dd")}
                    </time>
                  ) : null}
                </div>
                {entry.excerpt ? (
                  <p className="mt-2 text-sm text-muted-fg">{entry.excerpt}</p>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
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
      )}
    </section>
  );
}
