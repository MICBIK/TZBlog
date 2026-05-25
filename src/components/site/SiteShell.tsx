import { AnalyticsBeacon } from "@/components/site/AnalyticsBeacon";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { Toaster } from "@/components/ui/sonner";
import type { HeaderChannel } from "@/lib/navigation/publicNav";

export interface SiteShellProps {
  channels: HeaderChannel[];
  children: React.ReactNode;
}

export function SiteShell({ channels, children }: SiteShellProps) {
  return (
    <div
      data-site-motion-root
      data-reduced-motion-safe
      className="flex min-h-screen flex-col bg-bg text-fg"
    >
      <SiteHeader channels={channels} />
      <main
        data-ssr-visible
        data-motion-hydration-safe
        data-public-layout-shell="wide"
        className="mx-auto w-full max-w-7xl flex-1 px-6 py-16 md:px-8 md:py-24 lg:px-10"
      >
        {children}
      </main>
      <SiteFooter />
      <Toaster richColors position="top-right" />
      <AnalyticsBeacon />
    </div>
  );
}
