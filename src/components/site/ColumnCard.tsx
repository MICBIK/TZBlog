import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

type ColumnCardProps = {
  slug: string;
  name: string;
  description: string | null;
  cover: string | null;
  postCount: number;
};

export function ColumnCard({
  slug,
  name,
  description,
  cover,
  postCount,
}: ColumnCardProps) {
  const trimmedCover = cover?.trim();

  return (
    <Link
      href={`/columns/${slug}`}
      className="group relative block overflow-hidden rounded-xl border border-border bg-card transition hover:border-fg/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
    >
      {trimmedCover ? (
        <div
          data-column-cover
          className="aspect-[16/9] overflow-hidden border-b border-border bg-muted"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={trimmedCover}
            alt={name}
            width={1200}
            height={675}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
          />
        </div>
      ) : null}

      <div className="flex items-start justify-between gap-4 p-6">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold tracking-tight text-fg">
            {name}
          </h2>
          {description && (
            <p className="mt-2 line-clamp-2 text-sm text-muted-fg">
              {description}
            </p>
          )}
        </div>
        <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-fg transition group-hover:text-fg" />
      </div>
      <div className="px-6 pb-6 font-mono text-xs text-muted-fg">
        {postCount} 篇文章
      </div>
    </Link>
  );
}
