import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { getCurrentLocale } from "@/lib/i18n";
import {
  countPostsInColumn,
  listColumnsForLocale,
} from "@/lib/services/columns";

export async function HomeColumns() {
  const locale = getCurrentLocale();
  const columns = await listColumnsForLocale(locale);
  const enriched = await Promise.all(
    columns.map(async (column) => ({
      ...column,
      postCount: await countPostsInColumn(column.id),
    })),
  );
  const visibleColumns = enriched
    .filter((column) => column.postCount > 0)
    .slice(0, 6);

  return (
    <section
      aria-labelledby="home-columns-heading"
      className="space-y-[var(--space-stack-lg)]"
    >
      <header className="flex items-end justify-between gap-4">
        <div className="space-y-3">
          <p className="font-mono text-label tracking-label uppercase text-muted-fg">
            Topic trails
          </p>
          <h2
            id="home-columns-heading"
            className="font-serif text-h2 leading-display tracking-tight text-fg"
          >
            专栏
          </h2>
        </div>
        <Link
          href="/columns"
          className="text-sm text-muted-fg transition-colors hover:text-fg"
        >
          全部专栏 →
        </Link>
      </header>

      {visibleColumns.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleColumns.map((column) => (
            <Link
              key={column.id}
              href={`/columns/${column.slug}`}
              className="launch-panel group block space-y-4 p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 space-y-2">
                  <h3 className="font-serif text-lead leading-display tracking-tight text-fg">
                    {column.name}
                  </h3>
                  {column.description ? (
                    <p className="line-clamp-2 font-serif text-sm leading-body text-muted-fg">
                      {column.description}
                    </p>
                  ) : null}
                </div>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-fg transition-colors group-hover:text-fg" />
              </div>
              <p className="font-mono text-label tracking-label text-muted-fg">
                {column.postCount} articles
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border px-6 py-10 text-sm text-muted-fg">
          还没有可展示的专栏。
        </div>
      )}
    </section>
  );
}

export default HomeColumns;
