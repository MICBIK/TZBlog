import Link from "next/link";

import { getCurrentLocale } from "@/lib/i18n";
import {
  getNextEntrySuggestion,
  type PublicEntry,
} from "@/lib/services/entryPublic";

const LABELS = {
  series: (order?: number) =>
    order != null ? `系列下一篇 · 第 ${order} 章` : "系列下一篇",
  similar: () => "你可能感兴趣",
  recent: () => "近期文章",
} as const;

export async function NextEntry({ entry }: { entry: PublicEntry }) {
  const locale = getCurrentLocale();
  const suggestion = await getNextEntrySuggestion(entry, locale);
  if (!suggestion) return null;

  const label =
    suggestion.kind === "series"
      ? LABELS.series(suggestion.seriesOrder)
      : LABELS[suggestion.kind]();

  return (
    <nav
      data-next-entry={suggestion.kind}
      aria-label={label}
      className="mx-auto mt-12 max-w-3xl border-t border-border pt-8"
    >
      <p className="font-mono text-xs text-muted-fg">{label}</p>
      <Link
        href={suggestion.href}
        className="mt-2 inline-block text-lg font-medium text-fg transition hover:text-accent"
      >
        {suggestion.title}
      </Link>
    </nav>
  );
}
