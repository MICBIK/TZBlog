import { SiteShell } from "@/components/site/SiteShell";
import { listChannels } from "@/lib/services/channels";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const channels = await listChannels();

  return <SiteShell channels={channels}>{children}</SiteShell>;
}
