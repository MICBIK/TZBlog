import Link from "next/link";
import { format } from "date-fns";

type PostCardTag = {
  slug: string;
  name: string;
};

export type PostCardPost = {
  slug: string;
  cover?: string | null;
  title: string;
  excerpt?: string | null;
  publishedAt?: Date | string | null;
  columnName?: string | null;
  readingMinutes?: number | null;
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;
  tags: PostCardTag[];
};

type PostCardProps = {
  post: PostCardPost;
};

export function PostCard({ post }: PostCardProps) {
  const cover = post.cover?.trim();
  const headingId = `post-card-title-${post.slug}`;
  const readingMinutes =
    post.readingMinutes ?? estimateReadingMinutes(post.title, post.excerpt);
  const viewCount = post.viewCount ?? 0;
  const likeCount = post.likeCount ?? 0;
  const commentCount = post.commentCount ?? 0;

  return (
    <article
      aria-labelledby={headingId}
      data-cover-state={cover ? "with-cover" : "no-cover"}
      data-interactive-surface="post-card"
      data-post-card="dense"
      className="group flex min-w-0 max-w-full gap-4 rounded-lg border border-transparent px-3 py-6 transition hover:border-accent/40 hover:bg-muted/30 focus-within:border-accent/40 focus-within:bg-muted/30 md:gap-6"
    >
      {cover ? (
        <div
          data-post-cover
          className="aspect-[16/10] w-32 shrink-0 overflow-hidden rounded-md md:w-44"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cover}
            alt={post.title}
            width={1600}
            height={1000}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        </div>
      ) : null}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 font-mono text-xs text-muted-fg">
          {post.publishedAt && (
            <time>{format(new Date(post.publishedAt), "yyyy-MM-dd")}</time>
          )}
          {post.columnName && <span>{post.columnName}</span>}
          <span>{readingMinutes} 分钟阅读</span>
        </div>
        <h2
          id={headingId}
          className="mt-2 text-xl font-semibold tracking-tight text-fg md:text-2xl"
        >
          <Link
            href={`/posts/${post.slug}`}
            className="break-words hyphens-auto transition group-hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            {post.title}
          </Link>
        </h2>
        {post.excerpt && (
          <p className="mt-2 line-clamp-2 text-sm text-muted-fg">
            {post.excerpt}
          </p>
        )}
        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 font-mono text-xs text-muted-fg">
          <span>{viewCount} 次浏览</span>
          <span>{likeCount} 个赞</span>
          <span>{commentCount} 条评论</span>
        </div>
        {post.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2 font-mono text-xs text-muted-fg">
            {post.tags.slice(0, 4).map((t) => (
              <Link
                key={t.slug}
                href={`/tags/${encodeURIComponent(t.slug)}`}
                className="transition hover:text-fg"
              >
                #{t.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

function estimateReadingMinutes(title: string, excerpt?: string | null): number {
  const text = `${title} ${excerpt ?? ""}`.trim();
  if (!text) return 1;

  const cjkCount = (text.match(/[\u3400-\u9fff]/g) ?? []).length;
  const latinWordCount = (text.replace(/[\u3400-\u9fff]/g, " ").match(/\b\w+\b/g) ?? [])
    .length;
  const estimatedWords = cjkCount + latinWordCount;

  return Math.max(1, Math.ceil(estimatedWords / 500));
}
