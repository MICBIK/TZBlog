import type { Metadata } from "next";

import {
  countPostsInColumn,
  listColumnsForLocale,
} from "@/lib/services/columns";
import { getCurrentLocale } from "@/lib/i18n";
import { ColumnCard } from "@/components/site/ColumnCard";

export const metadata: Metadata = {
  title: "专栏 — TZBlog",
  description: "按主题归档的写作集合",
};

export default async function ColumnsPage() {
  const locale = getCurrentLocale();
  const columns = await listColumnsForLocale(locale);
  const enriched = await Promise.all(
    columns.map(async (c) => ({
      ...c,
      postCount: await countPostsInColumn(c.id),
    })),
  );

  return (
    <div className="space-y-12">
      <header>
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
          专栏
        </h1>
        <p className="mt-3 text-base text-muted-fg">
          按主题归档的写作集合。
        </p>
      </header>

      {enriched.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-fg">
          暂无专栏。
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {enriched.map((col) => (
            <ColumnCard
              key={col.id}
              slug={col.slug}
              name={col.name}
              description={col.description}
              cover={col.cover}
              postCount={col.postCount}
            />
          ))}
        </div>
      )}
    </div>
  );
}
