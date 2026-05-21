import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Toaster } from "@/components/ui/sonner";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-bg text-fg">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16 md:px-8 md:py-24">
        {children}
      </main>
      <SiteFooter />
      <Toaster richColors position="top-right" />
    </div>
  );
}
