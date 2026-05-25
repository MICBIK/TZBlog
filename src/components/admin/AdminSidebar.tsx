"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  Image as ImageIcon,
  LayoutDashboard,
  type LucideIcon,
  MessageSquare,
  Newspaper,
} from "lucide-react";

type AdminLink = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const adminLinks: AdminLink[] = [
  { href: "/admin", label: "概览", icon: LayoutDashboard },
  { href: "/admin/entries", label: "条目", icon: FileText },
  { href: "/admin/channels", label: "频道", icon: Newspaper },
  { href: "/admin/comments", label: "评论", icon: MessageSquare },
  { href: "/admin/media", label: "媒体", icon: ImageIcon },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-60 flex-col border-r border-border bg-bg">
      <div className="border-b border-border px-6 py-5">
        <Link
          href="/admin"
          className="text-base font-semibold tracking-tight text-fg"
        >
          TZBlog Admin
        </Link>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {adminLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              data-active={isActivePath(pathname, link.href) ? "true" : "false"}
              className="admin-sidebar-link flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Icon className="h-4 w-4" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === href;

  return pathname === href || pathname.startsWith(`${href}/`);
}
