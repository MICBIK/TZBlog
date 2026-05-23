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
  const activeFilters = [
    filter.q ? `关键词：${filter.q}` : null,
    filter.tag ? `标签：${filter.tag}` : null,
    filter.columnId ? `专栏：${filter.columnId}` : null,
  ].filter((item): item is string => item !== null);

  return (
    <div className="space-y-12">
      <header>
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
          文章
        </h1>
        <p className="mt-3 text-base text-muted-fg">{total} 篇文章</p>
      </header>

      <form
        action="/posts"
        aria-label="文章筛选"
        className="space-y-4 border-y border-border py-5"
        method="get"
        role="search"
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            aria-label="搜索文章"
            className="min-h-10 flex-1 rounded-md border border-input bg-bg px-3 py-2 text-sm text-fg outline-none transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            defaultValue={filter.q ?? ""}
            name="q"
            placeholder="搜索标题"
            type="search"
          />
          {filter.tag ? <input name="tag" type="hidden" value={filter.tag} /> : null}
          {filter.columnId ? (
            <input name="columnId" type="hidden" value={filter.columnId} />
          ) : null}
          <button
            className="min-h-10 rounded-md border border-border px-4 text-sm text-fg transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            type="submit"
          >
            搜索
          </button>
        </div>

        {activeFilters.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-muted-fg">
            {activeFilters.map((label) => (
              <span
                key={label}
                className="rounded-full border border-border px-2.5 py-1"
              >
                {label}
              </span>
            ))}
            <Link
              href="/posts"
              className="rounded-full border border-border px-2.5 py-1 transition hover:text-fg"
            >
              清除筛选
            </Link>
          </div>
        ) : null}
      </form>

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
              href={postsPageHref(filter, page - 1)}
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
              href={postsPageHref(filter, page + 1)}
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

function postsPageHref(
  filter: { q?: string; tag?: string; columnId?: string },
  page: number,
): string {
  const params = new URLSearchParams();

  if (filter.q) params.set("q", filter.q);
  if (filter.tag) params.set("tag", filter.tag);
  if (filter.columnId) params.set("columnId", filter.columnId);
  params.set("page", String(page));

  return `/posts?${params.toString()}`;
}
