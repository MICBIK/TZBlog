import Link from "next/link";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EntriesFilters } from "@/components/admin/entries/EntriesFilters";
import { EntriesTable } from "@/components/admin/entries/EntriesTable";
import { listArticles } from "@/lib/services/articles";
import { listArticleChannelsForLocale } from "@/lib/services/channels";
import { listTags } from "@/lib/services/tags";
import { articleFilterSchema } from "@/lib/schemas/entry";
import { getCurrentLocale } from "@/lib/i18n";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EntriesAdminPage({ searchParams }: Props) {
  const sp = await searchParams;
  const filter = articleFilterSchema.parse(
    Object.fromEntries(
      Object.entries(sp).map(([k, v]) => [
        k,
        Array.isArray(v) ? v[0] : (v ?? ""),
      ]),
    ),
  );
  const locale = getCurrentLocale();

  const [{ items, total, page, pageSize }, channels, tags] = await Promise.all([
    listArticles(filter, locale),
    listArticleChannelsForLocale(locale),
    listTags(),
  ]);

  return (
    <div className="flex flex-col gap-6 p-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">条目管理</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            共 {total} 篇条目。当前第 {page} 页。
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/entries/new">
            <Plus className="h-4 w-4" />
            新建条目
          </Link>
        </Button>
      </header>

      <EntriesFilters
        currentFilter={filter}
        columns={channels.map((c) => ({ id: c.id, name: c.name }))}
        tags={tags}
      />

      <EntriesTable
        initialItems={items}
        total={total}
        page={page}
        pageSize={pageSize}
        currentFilter={filter}
      />
    </div>
  );
}
