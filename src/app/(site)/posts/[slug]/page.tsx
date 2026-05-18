import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import type { Metadata } from "next";

import { getPostBySlug } from "@/lib/services/posts";
import { renderMarkdown } from "@/lib/markdown";
import { getCurrentLocale } from "@/lib/i18n";
import { PostViewBeacon } from "@/components/site/PostViewBeacon";

type Props = { params: Promise<{ slug: string }> };

type Translation = {
  locale: string;
  title?: string;
  name?: string;
  excerpt?: string | null;
  description?: string | null;
  content?: string | null;
};

type PostShape = {
  slug: string;
  status?: string;
  publishedAt?: Date | string | null;
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;
  translations?: Translation[];
  column?:
    | {
        slug: string;
        translations?: Translation[];
      }
    | null;
  tags?: Array<{ tag: { slug: string } } | { slug: string }>;
};

function pickTranslation<T extends Translation>(
  translations: T[] | undefined,
  locale: string,
): T | undefined {
  if (!translations || translations.length === 0) return undefined;
  return translations.find((t) => t.locale === locale) ?? translations[0];
}

function tagSlug(t: { tag?: { slug?: string }; slug?: string }): string | null {
  if (t.tag && typeof t.tag.slug === "string") return t.tag.slug;
  if (typeof t.slug === "string") return t.slug;
  return null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = (await getPostBySlug(slug)) as PostShape | null;
  if (!post || post.status !== "PUBLISHED") return {};
  const locale = getCurrentLocale();
  const tr = pickTranslation(post.translations, locale);
  return {
    title: `${tr?.title ?? slug} — TZBlog`,
    description: tr?.excerpt ?? undefined,
  };
}

export default async function PostDetailPage({ params }: Props) {
  const { slug } = await params;
  const post = (await getPostBySlug(slug)) as PostShape | null;
  if (!post || post.status !== "PUBLISHED") notFound();

  const locale = getCurrentLocale();
  const tr = pickTranslation(post.translations, locale);
  if (!tr) notFound();

  const html = await renderMarkdown(tr.content ?? "");

  const columnTr = post.column
    ? pickTranslation(post.column.translations, locale)
    : undefined;
  const columnLabel =
    columnTr?.name ?? columnTr?.title ?? post.column?.slug ?? null;

  const tagSlugs = (post.tags ?? [])
    .map((t) => tagSlug(t as { tag?: { slug?: string }; slug?: string }))
    .filter((s): s is string => typeof s === "string" && s.length > 0);

  return (
    <article className="space-y-10">
      <PostViewBeacon slug={post.slug} />

      <Link
        href="/posts"
        className="inline-block font-mono text-xs text-muted-fg transition hover:text-fg"
      >
        ← 所有文章
      </Link>

      <header className="space-y-4">
        <div className="flex items-baseline gap-3 font-mono text-xs text-muted-fg">
          {post.publishedAt && (
            <time>{format(new Date(post.publishedAt), "yyyy-MM-dd")}</time>
          )}
          {post.column && columnLabel && (
            <Link
              href={`/columns/${post.column.slug}`}
              className="transition hover:text-fg"
            >
              · {columnLabel}
            </Link>
          )}
        </div>
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
          {tr.title ?? slug}
        </h1>
        {tr.excerpt && <p className="text-lg text-muted-fg">{tr.excerpt}</p>}
        <div className="flex items-center gap-4 pt-2 font-mono text-xs text-muted-fg">
          <span>views {post.viewCount ?? 0}</span>
          <span>likes {post.likeCount ?? 0}</span>
          <span>comments {post.commentCount ?? 0}</span>
        </div>
      </header>

      <div
        className="prose prose-neutral max-w-none dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {tagSlugs.length > 0 && (
        <footer className="flex flex-wrap gap-2 border-t border-border pt-8 font-mono text-xs text-muted-fg">
          {tagSlugs.map((s) => (
            <Link
              key={s}
              href={`/posts?tag=${encodeURIComponent(s)}`}
              className="transition hover:text-fg"
            >
              #{s}
            </Link>
          ))}
        </footer>
      )}
    </article>
  );
}
