import { GithubCard } from "@/components/site/GithubCard";
import { HomeColumns } from "@/components/site/HomeColumns";
import { HomeFeaturedAndRecent } from "@/components/site/HomeFeaturedAndRecent";
import { HomeHero } from "@/components/site/HomeHero";
import { HomePrinciples } from "@/components/site/HomePrinciples";
import { HomeStats } from "@/components/site/HomeStats";
import { TechStack } from "@/components/site/TechStack";

export default function HomePage() {
  return (
    <div className="space-y-24">
      <HomeHero />

      <HomeFeaturedAndRecent />

      <HomeColumns />

      <HomePrinciples />

      <TechStack />

      <GithubCard />

      <HomeStats />
    </div>
  );
}
