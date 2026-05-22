import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PostCard } from "@/components/site/PostCard";
import { getCurrentLocale } from "@/lib/i18n";
import { postFilterSchema } from "@/lib/schemas/post";
import { listPosts } from "@/lib/services/posts";
import { getTagBySlug } from "@/lib/services/tags-public";

type SearchParams = Record<string, string | string[] | undefined>;

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParams>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tag = await getTagBySlug(slug);
  if (!tag) return { title: "Tag not found" };

  return {
    title: `${tag.name} — Tag`,
    description: `Posts tagged with ${tag.name}`,
  };
}

export default async function TagDetailPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const tag = await getTagBySlug(slug);
  if (!tag) notFound();

  const sp = await searchParams;
  const filter = postFilterSchema.parse({
    page: sp.page,
    pageSize: 12,
    status: "PUBLISHED",
    tag: slug,
  });
  const locale = getCurrentLocale();
  const { items, total, page, pageSize } = await listPosts(filter, locale);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <article className="space-y-12">
      <header className="space-y-3">
        <p className="font-mono text-label tracking-label uppercase text-muted-fg">
          TAG
        </p>
        <div className="h-px w-12 border-t border-border" aria-hidden="true" />
        <h1 className="font-serif text-h1 leading-display tracking-tight text-fg">
          {tag.name}
        </h1>
        <p className="font-mono text-sm text-muted-fg">
          {total} {total === 1 ? "post" : "posts"}
        </p>
      </header>

      {items.length === 0 ? (
        <p className="font-serif text-base leading-body text-muted-fg">
          No posts in this tag yet.
        </p>
      ) : (
        <div className="flex flex-col divide-y divide-border">
          {items.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <nav className="flex items-center justify-between font-mono text-sm">
          {page > 1 ? (
            <Link
              href={`?page=${page - 1}`}
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
              href={`?page=${page + 1}`}
              className="text-muted-fg transition hover:text-fg"
            >
              下一页 →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </article>
  );
}
