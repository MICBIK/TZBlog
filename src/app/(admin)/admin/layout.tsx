import { redirect } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";

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
    <div className="flex min-h-screen bg-[hsl(var(--bg))] text-[hsl(var(--fg))]">
      <aside className="flex w-60 shrink-0 flex-col border-r border-[hsl(var(--border))] px-4 py-6">
        <div className="mb-8 px-2 text-lg font-semibold tracking-tight">
          TZBlog
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm text-[hsl(var(--muted))] transition-colors hover:bg-[hsl(var(--accent))]/10 hover:text-[hsl(var(--fg))]"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-[hsl(var(--border))] px-6">
          <span className="text-sm text-[hsl(var(--muted))]">
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
              className="rounded-md border border-[hsl(var(--border))] px-3 py-1.5 text-sm transition-colors hover:bg-[hsl(var(--accent))]/10"
            >
              登出
            </button>
          </form>
        </header>

        <main className="flex-1 px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
