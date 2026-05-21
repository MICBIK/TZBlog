import Link from "next/link";

import { Button } from "@/components/ui/button";
import { PostCard } from "@/components/site/PostCard";
import { getCurrentLocale } from "@/lib/i18n";
import { listPosts } from "@/lib/services/posts";

const techStack = [
  "TypeScript",
  "React",
  "Next.js",
  "Node.js",
  "PostgreSQL",
  "Docker",
];

export default async function HomePage() {
  const locale = getCurrentLocale();
  const { items: recentPosts } = await listPosts(
    { page: 1, pageSize: 3, status: "PUBLISHED" },
    locale,
  );

  return (
    <div className="space-y-24">
      {/* Hero */}
      <section className="space-y-6">
        <h1 className="text-5xl font-bold tracking-tight md:text-7xl">
          Hi, I&apos;m HaiDen.
        </h1>
        <p className="text-lg text-muted-fg md:text-xl">
          A developer who builds things and writes about them.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Button asChild size="lg">
            <Link href="/posts">Read Blog</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/about">About Me</Link>
          </Button>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight">Tech Stack</h2>
        <div className="rounded-lg border border-border bg-muted/40 p-6 font-mono text-sm">
          <p className="text-muted-fg">
            <span className="text-accent">$</span> whoami
          </p>
          <ul className="mt-3 space-y-1">
            {techStack.map((tech) => (
              <li key={tech} className="text-fg">
                <span className="text-muted-fg">-</span> {tech}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Recent Posts */}
      <section className="space-y-6">
        <div className="flex items-baseline justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">
            Recent Posts
          </h2>
          <Link
            href="/posts"
            className="text-sm text-muted-fg hover:text-fg transition-colors"
          >
            View all
          </Link>
        </div>
        {recentPosts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-fg">
            还没有发布的文章。
          </div>
        ) : (
          <div
            data-testid="home-recent-posts"
            className="flex flex-col divide-y divide-border"
          >
            {recentPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </section>

      {/* Site Stats */}
      <section className="border-t border-border pt-8">
        <p className="text-sm text-muted-fg">
          0 views · 0 posts · 0 comments
        </p>
      </section>
    </div>
  );
}
