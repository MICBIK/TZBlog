import { notFound } from "next/navigation";
import type { Metadata } from "next";

import {
  ArticleReader,
  countArticleWords,
} from "@/components/reading/ArticleReader";
import { CommentSection } from "@/components/site/CommentSection";
import { LikeButton } from "@/components/site/LikeButton";
import { PostViewBeacon } from "@/components/site/PostViewBeacon";
import { DEFAULT_LOCALE, getCurrentLocale, type Locale } from "@/lib/i18n";
import { extractToc, renderMarkdown } from "@/lib/markdown";
import { getArticleBySlug, type ArticleWithRelations } from "@/lib/services/articles";
import { SITE_META } from "@/lib/site-meta";

type Props = { params: Promise<{ slug: string }> };

function pickPostTranslation(
  post: ArticleWithRelations,
  locale: Locale,
): ArticleWithRelations["translations"][number] | undefined {
  return (
    post.translations.find((t) => t.locale === locale) ??
    post.translations.find((t) => t.locale === DEFAULT_LOCALE) ??
    post.translations[0]
  );
}

function pickChannelTranslation(
  column: NonNullable<ArticleWithRelations["channel"]>,
  locale: Locale,
):
  | NonNullable<ArticleWithRelations["channel"]>["translations"][number]
  | undefined {
  return (
    column.translations.find((t) => t.locale === locale) ??
    column.translations.find((t) => t.locale === DEFAULT_LOCALE) ??
    column.translations[0]
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getArticleBySlug(slug);
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
  const post = await getArticleBySlug(slug);
  if (!post || post.status !== "PUBLISHED") notFound();

  const locale = getCurrentLocale();
  const tr = pickPostTranslation(post, locale);
  if (!tr) notFound();

  const html = await renderMarkdown(tr.content);
  const headings = await extractToc(tr.content);

  const channelTr = post.channel
    ? pickChannelTranslation(post.channel, locale)
    : undefined;
  const channelLabel = channelTr?.name ?? post.channel?.slug ?? null;
  const channelSlug = post.channel?.slug ?? null;

  const tagSlugs = post.tags.map((t) => t.tag.slug);
  const cover = post.cover?.trim();
  const titleId = `post-title-${post.slug}`;
  const author = post.author?.name ?? SITE_META.author;
  const wordCount = countArticleWords(tr.content);

  return (
    <ArticleReader
      title={tr.title}
      titleId={titleId}
      html={html}
      headings={headings}
      contentLength={tr.content.length}
      author={author}
      publishedAt={post.publishedAt}
      wordCount={wordCount}
      cover={cover || null}
      excerpt={tr.excerpt}
      viewCount={post.viewCount}
      slug={post.slug}
      postId={post.id}
      tagSlugs={tagSlugs}
      columnLabel={channelLabel}
      columnSlug={channelSlug}
      viewBeacon={<PostViewBeacon slug={post.slug} />}
      likeButton={
        <LikeButton slug={post.slug} initialLikeCount={post.likeCount} />
      }
      commentSection={
        <CommentSection postId={post.id} slug={post.slug} />
      }
    />
  );
}
