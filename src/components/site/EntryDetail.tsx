import Link from "next/link";
import { format } from "date-fns";

import {
  estimateReadingMinutes,
  readEntryCover,
  readReadingMinutes,
} from "@/components/channel-layouts/entryMeta";
import {
  ArticleReader,
  countArticleWords,
} from "@/components/reading/ArticleReader";
import { CommentSection } from "@/components/site/CommentSection";
import { EntryViewBeacon } from "@/components/site/EntryViewBeacon";
import { LikeButton } from "@/components/site/LikeButton";
import { DEFAULT_LOCALE, getCurrentLocale, type Locale } from "@/lib/i18n";
import { extractToc, renderMarkdown } from "@/lib/markdown";
import {
  pickEntryTranslation,
  type PublicEntry,
} from "@/lib/services/entryPublic";

export interface EntryDetailProps {
  entry: PublicEntry;
  locale?: Locale;
}

function pickChannelTranslation(
  entry: PublicEntry,
  locale: Locale,
): PublicEntry["channel"]["translations"][number] | undefined {
  return (
    entry.channel.translations.find((row) => row.locale === locale) ??
    entry.channel.translations.find((row) => row.locale === DEFAULT_LOCALE) ??
    entry.channel.translations[0]
  );
}

function readLinkMetadata(metadata: Record<string, unknown>) {
  return metadata as {
    sourceUrl: string;
    sourceTitle: string;
    sourceAuthor?: string;
    thumbnail?: string | null;
    domain?: string;
  };
}

function readQuoteMetadata(metadata: Record<string, unknown>) {
  return metadata as {
    author: string;
    source?: string;
    sourceUrl?: string;
  };
}

function readReviewMetadata(metadata: Record<string, unknown>) {
  return metadata as {
    itemTitle: string;
    itemAuthor?: string;
    rating: number;
    externalUrl?: string;
    cover?: string | null;
  };
}

function readHotTakeMetadata(metadata: Record<string, unknown>) {
  return metadata as {
    sourcePlatform: keyof typeof HOT_TAKE_PLATFORM_LABELS;
    sourceUrl: string;
    sourceSnippet: string;
  };
}

const HOT_TAKE_PLATFORM_LABELS = {
  weibo: "微博",
  twitter: "Twitter",
  aihot: "AI Hot",
  hackernews: "Hacker News",
  v2ex: "V2EX",
  zhihu: "知乎",
} as const;

function renderStars(rating: number): string {
  return "★".repeat(rating) + "☆".repeat(Math.max(0, 5 - rating));
}

export async function EntryDetail({ entry, locale: localeProp }: EntryDetailProps) {
  const locale = localeProp ?? getCurrentLocale();
  const tr = pickEntryTranslation(entry, locale);
  if (!tr) return null;

  const title = tr.title;
  const html = await renderMarkdown(entry.body);
  const tagSlugs = entry.tags.map((row) => row.tag.slug);
  const channelTr = pickChannelTranslation(entry, locale);
  const channelLabel = channelTr?.name ?? entry.channel.slug;
  const readingMinutes =
    readReadingMinutes(entry.metadata) ??
    estimateReadingMinutes(title, tr.excerpt);

  if (entry.kind === "ARTICLE") {
    const headings = await extractToc(entry.body);
    const cover = readEntryCover(entry.metadata, entry.kind);
    const titleId = `entry-title-${entry.slug}`;

    return (
      <ArticleReader
        title={title}
        titleId={titleId}
        html={html}
        headings={headings}
        contentLength={entry.body.length}
        author={entry.author.name ?? entry.author.email}
        publishedAt={entry.publishedAt}
        wordCount={countArticleWords(entry.body)}
        cover={cover}
        excerpt={tr.excerpt}
        viewCount={entry.viewCount}
        slug={entry.slug}
        readingMinutes={readingMinutes}
        postId={entry.id}
        tagSlugs={tagSlugs}
        columnLabel={channelLabel}
        columnSlug={entry.channel.slug}
        backHref={`/c/${entry.channel.slug}`}
        backLabel={`← ${channelLabel}`}
        likeButton={
          <LikeButton entryId={entry.id} initialLikeCount={entry.likeCount} />
        }
        commentSection={
          <CommentSection postId={entry.id} slug={entry.slug} />
        }
        viewBeacon={<EntryViewBeacon entryId={entry.id} />}
      />
    );
  }

  return (
    <article
      data-entry-kind={entry.kind}
      className="mx-auto max-w-3xl space-y-8"
    >
      <EntryViewBeacon entryId={entry.id} />

      <header className="space-y-3">
        <div className="flex flex-wrap items-baseline gap-3 font-mono text-xs text-muted-fg">
          {entry.publishedAt ? (
            <time>{format(new Date(entry.publishedAt), "yyyy-MM-dd")}</time>
          ) : null}
          <Link
            href={`/c/${entry.channel.slug}`}
            className="transition hover:text-fg"
          >
            · {channelLabel}
          </Link>
          {entry.kind !== "JOKE" ? (
            <span data-entry-reading-minutes>{readingMinutes} 分钟阅读</span>
          ) : null}
        </div>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          {title}
        </h1>
        <div className="flex items-center gap-4 font-mono text-xs text-muted-fg">
          <span>{entry.viewCount} 次浏览</span>
          <LikeButton entryId={entry.id} initialLikeCount={entry.likeCount} />
          <span>{entry.commentCount} 条评论</span>
        </div>
      </header>

      {entry.kind === "NOTE" ? (
        <div
          data-entry-note-body
          className="prose prose-neutral max-w-none dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : null}

      {entry.kind === "LINK" ? (
        <LinkEntryBody metadata={readLinkMetadata(entry.metadata)} html={html} />
      ) : null}

      {entry.kind === "QUOTE" ? (
        <QuoteEntryBody metadata={readQuoteMetadata(entry.metadata)} html={html} />
      ) : null}

      {entry.kind === "REVIEW" ? (
        <ReviewEntryBody metadata={readReviewMetadata(entry.metadata)} html={html} />
      ) : null}

      {entry.kind === "HOT_TAKE" ? (
        <HotTakeEntryBody metadata={readHotTakeMetadata(entry.metadata)} html={html} />
      ) : null}

      {entry.kind === "JOKE" ? (
        <div
          data-entry-joke-body
          className="prose prose-neutral max-w-none dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : null}

      {tagSlugs.length > 0 ? (
        <footer
          data-entry-tags
          className="flex flex-wrap gap-2 border-t border-border pt-8 font-mono text-xs text-muted-fg"
        >
          {tagSlugs.map((slug) => (
            <Link
              key={slug}
              href={`/tags/${encodeURIComponent(slug)}`}
              className="transition hover:text-fg"
            >
              #{slug}
            </Link>
          ))}
        </footer>
      ) : null}

      <CommentSection postId={entry.id} slug={entry.slug} />
    </article>
  );
}

function LinkEntryBody({
  metadata,
  html,
}: {
  metadata: ReturnType<typeof readLinkMetadata>;
  html: string;
}) {
  return (
    <div data-entry-link-body className="space-y-6">
      <a
        href={metadata.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        data-testid="entry-link-card" data-entry-link-card
        className="block rounded-xl border border-border bg-muted/30 p-5 transition hover:border-accent"
      >
        {metadata.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={metadata.thumbnail}
            alt=""
            className="mb-4 aspect-[2/1] w-full rounded-lg object-cover"
          />
        ) : null}
        <p className="font-mono text-xs text-muted-fg">
          {metadata.domain ?? new URL(metadata.sourceUrl).hostname}
        </p>
        <h2 className="mt-2 text-xl font-semibold">{metadata.sourceTitle}</h2>
        {metadata.sourceAuthor ? (
          <p className="mt-1 text-sm text-muted-fg">{metadata.sourceAuthor}</p>
        ) : null}
      </a>
      <div
        className="markdown-body max-w-none"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}

function QuoteEntryBody({
  metadata,
  html,
}: {
  metadata: ReturnType<typeof readQuoteMetadata>;
  html: string;
}) {
  return (
    <div data-testid="entry-quote" data-entry-quote className="space-y-6">
      <blockquote className="relative border-l-4 border-accent pl-8">
        <span
          aria-hidden
          className="absolute -left-1 -top-2 text-6xl leading-none text-accent/40"
        >
          {'"'}
        </span>
        <div
          className="prose prose-neutral max-w-none dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </blockquote>
      <footer className="space-y-1 font-mono text-sm text-muted-fg">
        <p data-entry-quote-author>— {metadata.author}</p>
        {metadata.sourceUrl ? (
          <a
            href={metadata.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-fg underline-offset-4 hover:underline"
          >
            {metadata.source ?? metadata.sourceUrl}
          </a>
        ) : metadata.source ? (
          <p>{metadata.source}</p>
        ) : null}
      </footer>
    </div>
  );
}

function ReviewEntryBody({
  metadata,
  html,
}: {
  metadata: ReturnType<typeof readReviewMetadata>;
  html: string;
}) {
  const cover = metadata.cover?.trim();

  return (
    <div data-entry-review className="space-y-6">
      <div className="flex flex-wrap items-start gap-4">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt={metadata.itemTitle}
            className="h-32 w-24 rounded-lg object-cover"
            data-entry-review-cover
          />
        ) : null}
        <div className="space-y-2">
          <p
            data-entry-review-rating
            aria-label={`${metadata.rating} 星`}
            className="text-xl text-accent"
          >
            {renderStars(metadata.rating)}
          </p>
          <h2 className="text-xl font-semibold">{metadata.itemTitle}</h2>
          {metadata.itemAuthor ? (
            <p className="text-sm text-muted-fg">{metadata.itemAuthor}</p>
          ) : null}
          {metadata.externalUrl ? (
            <a
              href={metadata.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-entry-review-link
              className="inline-block font-mono text-xs text-muted-fg underline-offset-4 hover:text-fg hover:underline"
            >
              查看原文
            </a>
          ) : null}
        </div>
      </div>
      <div
        className="markdown-body max-w-none"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}

function HotTakeEntryBody({
  metadata,
  html,
}: {
  metadata: ReturnType<typeof readHotTakeMetadata>;
  html: string;
}) {
  return (
    <div data-entry-hot-take className="space-y-6">
      <p
        data-entry-hot-take-platform
        className="inline-flex rounded-full border border-border px-3 py-1 font-mono text-xs text-muted-fg"
      >
        {HOT_TAKE_PLATFORM_LABELS[metadata.sourcePlatform]}
      </p>
      <blockquote
        data-entry-hot-take-snippet
        className="border-l-4 border-accent/60 pl-4 text-muted-fg italic"
      >
        {metadata.sourceSnippet}
      </blockquote>
      <div
        className="markdown-body max-w-none"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <a
        href={metadata.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="font-mono text-xs text-muted-fg underline-offset-4 hover:text-fg hover:underline"
      >
        来源链接
      </a>
    </div>
  );
}
