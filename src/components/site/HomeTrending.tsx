import Link from "next/link";

import type { HomeTrendingItem } from "@/lib/services/homePage";

function entryHref(item: HomeTrendingItem): string {
  if (item.kind === "ARTICLE" || item.kind === "REVIEW") {
    return `/posts/${item.slug}`;
  }

  return `/c/${item.channelSlug}#${item.slug}`;
}

export interface HomeTrendingProps {
  items: HomeTrendingItem[];
}

export function HomeTrending({ items }: HomeTrendingProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="home-trending-heading"
      data-testid="home-trending"
      className="space-y-4"
    >
      <h2
        id="home-trending-heading"
        className="font-serif text-h3 tracking-tight text-fg"
      >
        近期热门
      </h2>
      <ol className="space-y-3">
        {items.map((item, index) => (
          <li key={item.id} className="flex gap-3 text-sm">
            <span className="w-6 shrink-0 font-mono text-muted-fg">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div className="min-w-0 space-y-1">
              <Link
                href={entryHref(item)}
                className="font-medium text-fg hover:underline"
              >
                {item.title}
              </Link>
              <p className="text-xs text-muted-fg">{item.channelName}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
