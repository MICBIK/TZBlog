import Link from "next/link";
import { format } from "date-fns";

import { entryHref } from "./entryMeta";
import type { ChannelLayoutProps } from "./types";

const MOOD_LABELS: Record<string, string> = {
  curious: "🤔",
  focused: "🎯",
  frustrated: "😤",
  celebratory: "🎉",
};

function dayKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

function readMood(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }
  const mood = (metadata as Record<string, unknown>).mood;
  return typeof mood === "string" ? mood : null;
}

export function TimelineLayout({ channelSlug, entries }: ChannelLayoutProps) {
  if (entries.length === 0) {
    return (
      <div
        data-testid="timeline-empty-state"
        className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-fg"
      >
        这个频道还没有发布内容。
      </div>
    );
  }

  return (
    <div
      data-testid="timeline-layout"
      data-layout="timeline"
      className="relative mx-auto max-w-3xl pl-8"
    >
      <div
        aria-hidden="true"
        className="absolute bottom-0 left-3 top-0 w-px bg-border"
      />

      <ul className="space-y-8">
        {entries.map((entry, index) => {
          const day = entry.publishedAt ? dayKey(entry.publishedAt) : "unknown";
          const previousDay =
            index > 0
              ? entries[index - 1]?.publishedAt
                ? dayKey(entries[index - 1]!.publishedAt!)
                : "unknown"
              : null;
          const showHeader = day !== previousDay;
          const mood = entry.kind === "NOTE" ? readMood(entry.metadata) : null;
          const href = entryHref(channelSlug, entry.slug, entry.kind);

          return (
            <li key={entry.id} id={entry.slug}>
              {showHeader ? (
                <div
                  data-testid="timeline-day-header"
                  className="relative mb-4 font-mono text-xs uppercase tracking-wide text-muted-fg"
                >
                  <span className="absolute -left-8 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-accent" />
                  {entry.publishedAt
                    ? format(entry.publishedAt, "yyyy-MM-dd")
                    : "未发布"}
                </div>
              ) : null}

              <article
                data-testid="timeline-entry"
                className="relative rounded-xl border border-border p-4"
              >
                <span className="absolute -left-[1.37rem] top-5 h-2 w-2 rounded-full border border-accent bg-bg" />
                <div className="flex items-start gap-2">
                  {mood ? (
                    <span
                      data-testid={`timeline-mood-${mood}`}
                      aria-label={`mood-${mood}`}
                      title={mood}
                    >
                      {MOOD_LABELS[mood] ?? "•"}
                    </span>
                  ) : null}
                  <div className="min-w-0 flex-1 space-y-2">
                    {entry.publishedAt ? (
                      <time
                        dateTime={entry.publishedAt.toISOString()}
                        className="font-mono text-xs text-muted-fg"
                      >
                        {format(entry.publishedAt, "HH:mm")}
                      </time>
                    ) : null}
                    <h2 className="text-base font-semibold text-fg">
                      <Link href={href} className="hover:underline">
                        {entry.title}
                      </Link>
                    </h2>
                  </div>
                </div>
              </article>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
