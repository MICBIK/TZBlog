import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import type { Metadata } from "next";

import { getPostBySlug, type PostWithRelations } from "@/lib/services/posts";
import { extractToc, renderMarkdown } from "@/lib/markdown";
import { DEFAULT_LOCALE, getCurrentLocale, type Locale } from "@/lib/i18n";
import { PostViewBeacon } from "@/components/site/PostViewBeacon";
import { PostToc } from "@/components/site/PostToc";
import { LikeButton } from "@/components/site/LikeButton";
import { CommentSection } from "@/components/site/CommentSection";
import { MarkdownCopyButtons } from "@/components/markdown/MarkdownCopyButtons";

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
  const headings = await extractToc(tr.content);

  const columnTr = post.column
    ? pickColumnTranslation(post.column, locale)
    : undefined;
  const columnLabel = columnTr?.name ?? post.column?.slug ?? null;

  const tagSlugs = post.tags.map((t) => t.tag.slug);
  const cover = post.cover?.trim();
  const titleId = `post-title-${post.slug}`;

  return (
    <article
      aria-labelledby={titleId}
      data-article-shell="editorial"
      className="lg:grid lg:justify-center lg:gap-12 lg:grid-cols-[minmax(0,760px)_minmax(220px,280px)]"
    >
      <div data-article-body-column className="min-w-0 max-w-[760px] space-y-10">
        <PostViewBeacon slug={post.slug} />

        <Link
          href="/posts"
          className="inline-block font-mono text-xs text-muted-fg transition hover:text-fg"
        >
          ← 所有文章
        </Link>

        <header data-article-header className="space-y-4">
          {cover ? (
            <div
              data-article-cover
              className="aspect-[3/1] w-full overflow-hidden rounded-xl"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={cover}
                alt={tr.title}
                width={1600}
                height={534}
                className="h-full w-full object-cover"
              />
            </div>
          ) : null}
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
          <h1
            id={titleId}
            className="text-4xl font-semibold tracking-tight md:text-5xl"
          >
            {tr.title}
          </h1>
          {tr.excerpt && <p className="text-lg text-muted-fg">{tr.excerpt}</p>}
          <div className="flex items-center gap-4 pt-2 font-mono text-xs text-muted-fg">
            <span>{post.viewCount} 次浏览</span>
            <LikeButton slug={post.slug} initialLikeCount={post.likeCount} />
            <span>{post.commentCount} 条评论</span>
          </div>
        </header>

        <div
          data-article-content
          className="markdown-body max-w-none"
          dangerouslySetInnerHTML={{ __html: html }}
        />
        <MarkdownCopyButtons />

        {tagSlugs.length > 0 && (
          <footer className="flex flex-wrap gap-2 border-t border-border pt-8 font-mono text-xs text-muted-fg">
            {tagSlugs.map((s) => (
              <Link
                key={s}
                href={`/tags/${encodeURIComponent(s)}`}
                className="transition hover:text-fg"
              >
                #{s}
              </Link>
            ))}
          </footer>
        )}

        <CommentSection postId={post.id} slug={post.slug} />
      </div>

      <aside
        aria-label="文章辅助信息"
        data-article-right-rail
        className="hidden lg:block"
      >
        <div className="sticky top-24">
          {headings.length > 0 ? <PostToc headings={headings} /> : null}
          <nav
            aria-label="相关文章"
            className="mt-8 border-t border-border pt-6 font-mono text-xs"
          >
            <Link
              href="/posts"
              className="text-muted-fg transition-colors hover:text-fg"
            >
              更多文章
            </Link>
          </nav>
        </div>
      </aside>
    </article>
  );
}
