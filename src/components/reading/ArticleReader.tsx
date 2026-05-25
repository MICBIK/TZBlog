import Link from "next/link";
import { format } from "date-fns";
import type { ReactNode } from "react";

import { MarkdownCopyButtons } from "@/components/markdown/MarkdownCopyButtons";
import type { TocHeading } from "@/lib/markdown";
import { resolveFontProse } from "@/lib/theme/font";

import { ReadingProgress } from "./ReadingProgress";
import { Toc } from "./Toc";

export interface ArticleReaderProps {
  title: string;
  titleId: string;
  html: string;
  headings: TocHeading[];
  contentLength: number;
  author: string;
  publishedAt?: Date | null;
  wordCount: number;
  cover?: string | null;
  excerpt?: string | null;
  viewCount: number;
  readingMinutes?: number;
  slug: string;
  postId: string;
  tagSlugs?: string[];
  columnLabel?: string | null;
  columnSlug?: string | null;
  likeButton: ReactNode;
  commentSection: ReactNode;
  viewBeacon?: ReactNode;
  nextEntry?: ReactNode;
  backHref?: string;
  backLabel?: string;
}

export function ArticleReader({
  title,
  titleId,
  html,
  headings,
  contentLength,
  author,
  publishedAt,
  wordCount,
  cover,
  excerpt,
  viewCount,
  readingMinutes,
  slug,
  postId,
  tagSlugs = [],
  columnLabel,
  columnSlug,
  likeButton,
  commentSection,
  viewBeacon,
  nextEntry,
  backHref = "/posts",
  backLabel = "← 所有文章",
}: ArticleReaderProps) {
  const proseFont = resolveFontProse("ink");
  const formattedDate = publishedAt
    ? format(new Date(publishedAt), "yyyy-MM-dd")
    : null;

  return (
    <>
      <ReadingProgress />
      <article
        aria-labelledby={titleId}
        data-article-reader
        data-reduced-motion-safe
        className="relative mx-auto w-full lg:grid lg:max-w-none lg:grid-cols-[minmax(0,52ch)_minmax(200px,280px)] lg:justify-center lg:gap-12"
        style={{ fontFamily: proseFont }}
      >
        <div className="mx-auto min-w-0 max-w-[52ch] space-y-10">
          {viewBeacon}

          <Link
            href={backHref}
            className="inline-block font-mono text-xs text-muted-fg transition hover:text-fg"
          >
            {backLabel}
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
                  alt={title}
                  width={1600}
                  height={534}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : null}

            <div className="flex items-baseline gap-3 font-mono text-xs text-muted-fg">
              {formattedDate ? <time dateTime={formattedDate}>{formattedDate}</time> : null}
              {columnLabel && columnSlug ? (
                <Link
                  href={`/columns/${columnSlug}`}
                  className="transition hover:text-fg"
                >
                  · {columnLabel}
                </Link>
              ) : null}
              {readingMinutes ? (
                <span>{readingMinutes} 分钟阅读</span>
              ) : null}
            </div>

            <h1
              id={titleId}
              className="text-3xl font-semibold tracking-tight md:text-4xl"
            >
              {title}
            </h1>

            {excerpt ? <p className="text-lg text-muted-fg">{excerpt}</p> : null}

            <div className="flex flex-wrap items-center gap-4 pt-2 font-mono text-xs text-muted-fg">
              <span>{viewCount} 次浏览</span>
              {likeButton}
            </div>
          </header>

          <Toc
            headings={headings}
            contentLength={contentLength}
            placement="inline"
          />

          <div
            data-article-content
            className="markdown-body max-w-none"
            dangerouslySetInnerHTML={{ __html: html }}
          />
          <MarkdownCopyButtons />

          <footer
            role="contentinfo"
            data-article-footer
            className="flex flex-wrap items-center gap-2 border-t border-border pt-8 font-mono text-xs text-muted-fg"
          >
            <span
              data-vermilion-seal
              aria-hidden="true"
              className="text-accent"
            >
              ■
            </span>
            <span>{author}</span>
            {formattedDate ? <span>{formattedDate}</span> : null}
            <span>{wordCount} 字</span>
          </footer>

          {tagSlugs.length > 0 ? (
            <div className="flex flex-wrap gap-2 font-mono text-xs text-muted-fg">
              {tagSlugs.map((tagSlug) => (
                <Link
                  key={tagSlug}
                  href={`/tags/${encodeURIComponent(tagSlug)}`}
                  className="transition hover:text-fg"
                >
                  #{tagSlug}
                </Link>
              ))}
            </div>
          ) : null}

          {nextEntry}

          <div data-post-id={postId} data-slug={slug}>
            {commentSection}
          </div>
        </div>

        <Toc
          headings={headings}
          contentLength={contentLength}
          placement="sidebar"
        />
      </article>
    </>
  );
}

export function countArticleWords(content: string): number {
  const plain = content
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)]\([^)]*\)/g, "$1")
    .replace(/[#>*_~\-|]/g, " ")
    .replace(/\s+/g, "")
    .trim();

  return plain.length;
}
