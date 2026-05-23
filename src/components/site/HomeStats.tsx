import { format } from "date-fns";

import { getSiteStats } from "@/lib/services/stats";

export async function HomeStats() {
  const stats = await getSiteStats();
  const lastShipped = stats.lastShippedAt
    ? format(stats.lastShippedAt, "yyyy-MM")
    : "尚未发布";

  return (
    <section data-home-stats className="border-t border-border pt-8">
      <p className="font-mono text-[length:var(--text-mono-sm)] text-muted-fg">
        v0.x · {stats.posts} 篇文章 · 近 7 天 {stats.viewsInLast7Days} 次浏览 ·
        {" "}最近发布 {lastShipped}
      </p>
    </section>
  );
}

export default HomeStats;
