import Link from "next/link";
import { format } from "date-fns";

type PostCardTag = {
  slug: string;
};

export type PostCardPost = {
  slug: string;
  cover?: string | null;
  title: string;
  excerpt?: string | null;
  publishedAt?: Date | string | null;
  columnName?: string | null;
  tags: PostCardTag[];
};

type PostCardProps = {
  post: PostCardPost;
};

export function PostCard({ post }: PostCardProps) {
  const cover = post.cover?.trim();

  return (
    <Link
      href={`/posts/${post.slug}`}
      className="group flex gap-4 py-6 transition md:gap-6"
    >
      {cover ? (
        <div className="aspect-[16/10] w-32 shrink-0 overflow-hidden rounded-md md:w-44">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cover}
            alt={post.title}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        </div>
      ) : null}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-3 font-mono text-xs text-muted-fg">
          {post.publishedAt && (
            <time>{format(new Date(post.publishedAt), "yyyy-MM-dd")}</time>
          )}
          {post.columnName && <span>· {post.columnName}</span>}
        </div>
        <h2 className="mt-2 text-xl font-semibold tracking-tight text-fg group-hover:underline md:text-2xl">
          {post.title}
        </h2>
        {post.excerpt && (
          <p className="mt-2 line-clamp-2 text-sm text-muted-fg">
            {post.excerpt}
          </p>
        )}
        {post.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2 font-mono text-xs text-muted-fg">
            {post.tags.slice(0, 4).map((t) => (
              <span key={t.slug}>#{t.slug}</span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
