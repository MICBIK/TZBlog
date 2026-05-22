import Link from "next/link";

import { GithubCard } from "@/components/site/GithubCard";
import { HeroEditorial } from "@/components/site/HeroEditorial";
import { LaunchNarrative } from "@/components/site/LaunchNarrative";
import { PostCard } from "@/components/site/PostCard";
import { TechStack } from "@/components/site/TechStack";
import { getCurrentLocale } from "@/lib/i18n";
import { listPosts } from "@/lib/services/posts";
import { getSiteStats } from "@/lib/services/stats";

export default async function HomePage() {
  const locale = getCurrentLocale();
  const { items: recentPosts } = await listPosts(
    { page: 1, pageSize: 3, status: "PUBLISHED" },
    locale,
  );
  const stats = await getSiteStats();

  return (
    <div className="space-y-24">
      <HeroEditorial />

      <LaunchNarrative />

      <TechStack />

      <GithubCard />

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
          {stats.views} views · {stats.posts} posts · {stats.comments} comments
        </p>
      </section>
    </div>
  );
}
