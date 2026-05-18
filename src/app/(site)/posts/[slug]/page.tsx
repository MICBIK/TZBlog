import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import type { Metadata } from "next";

import { getPostBySlug, type PostWithRelations } from "@/lib/services/posts";
import { renderMarkdown } from "@/lib/markdown";
import { DEFAULT_LOCALE, getCurrentLocale, type Locale } from "@/lib/i18n";
import { PostViewBeacon } from "@/components/site/PostViewBeacon";

type Props = { params: Promise<{ slug: string }> };

function pickPostTranslation(
  post: PostWithRelations,
  locale: Locale,
): PostWithRelations["translations"][number] | undefined {
  return (
    post.translations.find((t) => t.locale === locale) ??
    post.translations.find((t) => t.locale === DEFAULT_LOCALE) ??
    post.translations[0]
  );
}

function pickColumnTranslation(
  column: NonNullable<PostWithRelations["column"]>,
  locale: Locale,
):
  | NonNullable<PostWithRelations["column"]>["translations"][number]
  | undefined {
  return (
    column.translations.find((t) => t.locale === locale) ??
    column.translations.find((t) => t.locale === DEFAULT_LOCALE) ??
    column.translations[0]
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post || post.status !== "PUBLISHED") return {};
  const locale = getCurrentLocale();
  const tr = pickPostTranslation(post, locale);
  return {
    title: `${tr?.title ?? slug} — TZBlog`,
    description: tr?.excerpt ?? undefined,
  };
}

export default async function PostDetailPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post || post.status !== "PUBLISHED") notFound();

  const locale = getCurrentLocale();
  const tr = pickPostTranslation(post, locale);
  if (!tr) notFound();

  const html = await renderMarkdown(tr.content);

  const columnTr = post.column
    ? pickColumnTranslation(post.column, locale)
    : undefined;
  const columnLabel = columnTr?.name ?? post.column?.slug ?? null;

  const tagSlugs = post.tags.map((t) => t.tag.slug);

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
          {tr.title}
        </h1>
        {tr.excerpt && <p className="text-lg text-muted-fg">{tr.excerpt}</p>}
        <div className="flex items-center gap-4 pt-2 font-mono text-xs text-muted-fg">
          <span>views {post.viewCount}</span>
          <span>likes {post.likeCount}</span>
          <span>comments {post.commentCount}</span>
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
