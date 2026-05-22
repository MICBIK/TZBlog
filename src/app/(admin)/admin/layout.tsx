import { redirect } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";

import { Toaster } from "@/components/ui/sonner";
import { auth, signOut } from "@/lib/auth";

const NAV_ITEMS = [
  { href: "/admin", label: "概览" },
  { href: "/admin/posts", label: "文章" },
  { href: "/admin/columns", label: "专栏" },
  { href: "/admin/comments", label: "评论" },
  { href: "/admin/media", label: "媒体" },
  { href: "/admin/analytics", label: "分析" },
  { href: "/admin/settings", label: "设置" },
];

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-bg text-fg">
      <aside className="flex w-60 shrink-0 flex-col border-r border-border px-4 py-6">
        <div className="mb-8 px-2 text-lg font-semibold tracking-tight">
          TZBlog
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm text-muted-fg transition-colors hover:bg-muted hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-border px-6">
          <span className="text-sm text-muted-fg">
            {session.user.email}
          </span>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="rounded-md border border-border px-3 py-1.5 text-sm text-fg transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              登出
            </button>
          </form>
        </header>

        <main className="flex-1 px-6 py-8">{children}</main>
        <Toaster richColors position="top-right" />
      </div>
    </div>
  );
}
