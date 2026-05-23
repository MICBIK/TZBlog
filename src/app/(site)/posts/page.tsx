import Link from "next/link";
import type { Metadata } from "next";

import { listPosts } from "@/lib/services/posts";
import { postFilterSchema } from "@/lib/schemas/post";
import { getCurrentLocale } from "@/lib/i18n";
import { PostCard } from "@/components/site/PostCard";

export const metadata: Metadata = {
  title: "文章 — TZBlog",
  description: "所有已发布文章",
};

type SearchParams = Record<string, string | string[] | undefined>;

type Props = {
  searchParams: Promise<SearchParams>;
};

export default async function PostsListPage({ searchParams }: Props) {
  const sp = await searchParams;

  // Public list always pins to PUBLISHED — admins use a separate route.
  const filter = postFilterSchema.parse({
    page: sp.page,
    pageSize: sp.pageSize ?? 12,
    status: "PUBLISHED",
    tag: sp.tag,
    columnId: sp.columnId,
    q: sp.q,
  });
  const locale = getCurrentLocale();
  const { items, total, page, pageSize } = await listPosts(filter, locale);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-12">
      <header>
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
          文章
        </h1>
        <p className="mt-3 text-base text-muted-fg">{total} 篇文章</p>
      </header>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-fg">
          还没有发布的文章。
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-border">
          {items.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <nav className="flex items-center justify-between font-mono text-sm">
          {page > 1 ? (
            <Link
              href={`/posts?page=${page - 1}`}
              className="text-muted-fg transition hover:text-fg"
            >
              ← 上一页
            </Link>
          ) : (
            <span />
          )}
          <span className="text-muted-fg">
            {page} / {totalPages}
          </span>
          {page < totalPages ? (
            <Link
              href={`/posts?page=${page + 1}`}
              className="text-muted-fg transition hover:text-fg"
            >
              下一页 →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}
