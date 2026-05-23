import { format } from "date-fns";
import Link from "next/link";

import { PostCard } from "@/components/site/PostCard";
import { auth } from "@/lib/auth";
import { getCurrentLocale } from "@/lib/i18n";
import { listPosts, type PostListItem } from "@/lib/services/posts";

export async function HomeFeaturedAndRecent() {
  const locale = getCurrentLocale();
  const [{ items }, session] = await Promise.all([
    listPosts({ status: "PUBLISHED", page: 1, pageSize: 8 }, locale),
    auth(),
  ]);
  const [featured, ...recentPosts] = items;

  return (
    <section
      aria-labelledby="home-featured-heading"
      className="space-y-[var(--space-stack-lg)]"
    >
      <header className="flex items-end justify-between gap-4">
        <div className="space-y-3">
          <p className="font-mono text-label tracking-label uppercase text-muted-fg">
            Source notes
          </p>
          <h2
            id="home-featured-heading"
            className="font-serif text-h2 leading-display tracking-tight text-fg"
          >
            最新文章
          </h2>
        </div>
        <Link
          href="/posts"
          className="text-sm text-muted-fg transition-colors hover:text-fg"
        >
          所有文章 →
        </Link>
      </header>

      {featured ? (
        <div className="grid gap-[var(--space-stack-lg)] lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
          <FeaturedPost post={featured} />
          <div
            data-testid="home-recent-posts"
            className="flex flex-col divide-y divide-border"
          >
            {recentPosts.map((post) => (
              <PostCard
                key={post.id}
                post={{
                  ...post,
                  cover: null,
                }}
              />
            ))}
          </div>
        </div>
      ) : (
        <EmptyState showAdminLink={session?.user?.role === "ADMIN"} />
      )}
    </section>
  );
}

function FeaturedPost({ post }: { post: PostListItem }) {
  const cover = post.cover?.trim();

  return (
    <article
      data-testid="home-featured-post"
      className="launch-panel group overflow-hidden"
    >
      <div
        data-testid="home-featured-cover"
        className="aspect-[3/1] overflow-hidden bg-muted"
      >
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt=""
            width={1800}
            height={600}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="h-full w-full bg-[radial-gradient(circle_at_20%_20%,hsl(var(--accent)_/_0.20),transparent_34%),linear-gradient(135deg,hsl(var(--muted)),hsl(var(--bg)))]" />
        )}
      </div>

      <div className="space-y-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-3 font-mono text-label tracking-label text-muted-fg">
          {post.publishedAt ? (
            <time>{format(new Date(post.publishedAt), "yyyy-MM-dd")}</time>
          ) : null}
          {post.columnName ? <span>· {post.columnName}</span> : null}
        </div>

        <h3 className="font-serif text-h2 leading-display tracking-tight text-fg">
          <Link
            href={`/posts/${post.slug}`}
            className="transition group-hover:underline"
          >
            {post.title}
          </Link>
        </h3>

        {post.excerpt ? (
          <p className="line-clamp-2 font-serif text-base leading-body text-muted-fg">
            {post.excerpt}
          </p>
        ) : null}

        {post.tags.length > 0 ? (
          <div className="flex flex-wrap gap-2 font-mono text-xs text-muted-fg">
            {post.tags.slice(0, 4).map((tag) => (
              <Link
                key={tag.slug}
                href={`/tags/${encodeURIComponent(tag.slug)}`}
                className="transition-colors hover:text-fg"
              >
                #{tag.name}
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function EmptyState({ showAdminLink }: { showAdminLink: boolean }) {
  return (
    <div className="rounded-xl border border-dashed border-border px-6 py-14 text-center">
      <p className="text-sm text-muted-fg">还没有发布的文章。</p>
      {showAdminLink ? (
        <Link
          href="/admin/posts/new"
          className="mt-4 inline-flex text-sm text-fg underline-offset-4 hover:underline"
        >
          新建文章
        </Link>
      ) : null}
    </div>
  );
}

export default HomeFeaturedAndRecent;
