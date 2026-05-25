import type { HomeTrendingItem } from "@/lib/services/homePage";

export function HomeTrending({ items }: { items: HomeTrendingItem[] }) {
  if (items.length === 0) return null;
  return (
    <section aria-labelledby="home-trending-heading" data-testid="home-trending" className="space-y-4">
      <h2 id="home-trending-heading" className="font-serif text-h3 text-fg">近期热门</h2>
    </section>
  );
}
