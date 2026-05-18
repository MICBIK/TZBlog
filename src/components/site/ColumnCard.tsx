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
  // TODO: render `cover` as a 16:9 thumbnail (next/image) once design assets land.
  cover: _cover,
  postCount,
}: ColumnCardProps) {
  void _cover;

  return (
    <Link
      href={`/columns/${slug}`}
      className="group relative block rounded-xl border border-border bg-card p-6 transition hover:border-fg/20"
    >
      <div className="flex items-start justify-between gap-4">
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
      <div className="mt-4 font-mono text-xs text-muted-fg">
        {postCount} 篇文章
      </div>
    </Link>
  );
}
