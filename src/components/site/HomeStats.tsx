import { format } from "date-fns";

import { getSiteStats } from "@/lib/services/stats";

export async function HomeStats() {
  const stats = await getSiteStats();
  const lastShipped = stats.lastShippedAt
    ? format(stats.lastShippedAt, "MMM yyyy")
    : "not shipped yet";

  return (
    <section data-home-stats className="border-t border-border pt-8">
      <p className="font-mono text-[length:var(--text-mono-sm)] text-muted-fg">
        v0.x · {stats.posts} posts · {stats.viewsInLast7Days} views in 7 days ·
        {" "}last shipped {lastShipped}
      </p>
    </section>
  );
}

export default HomeStats;
