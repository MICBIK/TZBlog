import Link from "next/link";
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
  { href: "/admin/posts", label: "文章", icon: FileText },
  { href: "/admin/columns", label: "专栏", icon: Newspaper },
  { href: "/admin/comments", label: "评论", icon: MessageSquare },
  { href: "/admin/media", label: "媒体", icon: ImageIcon },
];

export function AdminSidebar() {
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
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-fg hover:bg-muted hover:text-fg transition-colors"
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
