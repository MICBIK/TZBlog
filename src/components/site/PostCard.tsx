import Link from "next/link";
import { format } from "date-fns";

type PostCardTag = {
  slug: string;
};

type PostCardPost = {
  slug: string;
  title: string;
  excerpt?: string | null;
  publishedAt?: Date | string | null;
  columnName?: string | null;
  tags: PostCardTag[];
  viewCount?: number;
};

type PostCardProps = {
  post: PostCardPost;
};

/**
 * Minimal list-row card used on the public posts index.
 *
 * Visual language follows the project's Claude/Apple/OpenAI-leaning style:
 * generous whitespace, mono metadata, no shadows, hover-only affordances.
 * Counts (viewCount) are intentionally not shown here to keep the index calm —
 * detail page surfaces them.
 */
export function PostCard({ post }: PostCardProps) {
  return (
    <Link href={`/posts/${post.slug}`} className="group block py-6 transition">
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
        <p className="mt-2 line-clamp-2 text-sm text-muted-fg">{post.excerpt}</p>
      )}
      {post.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2 font-mono text-xs text-muted-fg">
          {post.tags.slice(0, 4).map((t) => (
            <span key={t.slug}>#{t.slug}</span>
          ))}
        </div>
      )}
    </Link>
  );
}
