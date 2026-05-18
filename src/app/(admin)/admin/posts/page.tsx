import Link from "next/link";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PostsFilters } from "@/components/admin/posts/PostsFilters";
import { PostsTable } from "@/components/admin/posts/PostsTable";
import { listPosts } from "@/lib/services/posts";
import { listColumnsForLocale } from "@/lib/services/columns";
import { listTags } from "@/lib/services/tags";
import { postFilterSchema } from "@/lib/schemas/post";
import { getCurrentLocale } from "@/lib/i18n";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PostsAdminPage({ searchParams }: Props) {
  const sp = await searchParams;
  const filter = postFilterSchema.parse(
    Object.fromEntries(
      Object.entries(sp).map(([k, v]) => [
        k,
        Array.isArray(v) ? v[0] : (v ?? ""),
      ]),
    ),
  );
  const locale = getCurrentLocale();

  const [{ items, total, page, pageSize }, columns, tags] = await Promise.all([
    listPosts(filter, locale),
    listColumnsForLocale(locale),
    listTags(),
  ]);

  return (
    <div className="flex flex-col gap-6 p-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">文章管理</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            共 {total} 篇文章。当前第 {page} 页。
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/posts/new">
            <Plus className="h-4 w-4" />
            新建文章
          </Link>
        </Button>
      </header>

      <PostsFilters
        currentFilter={filter}
        columns={columns.map((c: { id: string; name: string }) => ({
          id: c.id,
          name: c.name,
        }))}
        tags={tags}
      />

      <PostsTable
        initialItems={items}
        total={total}
        page={page}
        pageSize={pageSize}
        currentFilter={filter}
      />
    </div>
  );
}
