"use client";

import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface AdminHeaderProps {
  email?: string | null;
  signOutAction: () => void | Promise<void>;
}

const SECTION_LABELS: Record<string, string> = {
  posts: "文章",
  entries: "文章",
  columns: "专栏",
  channels: "频道",
  comments: "评论",
  media: "媒体",
};

const ACTION_LABELS: Record<string, string> = {
  new: "新建",
  edit: "编辑",
};

export function AdminHeader({ email, signOutAction }: AdminHeaderProps) {
  const pathname = usePathname();
  const breadcrumb = buildBreadcrumb(pathname);

  return (
    <header className="flex h-14 items-center justify-between border-b border-border px-6">
      <nav
        aria-label="后台路径"
        className="text-sm font-medium text-muted-fg"
      >
        {breadcrumb.join(" / ")}
      </nav>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="text-fg hover:bg-muted hover:text-fg"
          >
            {email ?? "Admin"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <form action={signOutAction}>
            <DropdownMenuItem asChild>
              <button type="submit" className="w-full text-left">
                登出
              </button>
            </DropdownMenuItem>
          </form>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}

function buildBreadcrumb(pathname: string): string[] {
  const segments = pathname.split("/").filter(Boolean);
  const adminIndex = segments.indexOf("admin");
  const tail = adminIndex >= 0 ? segments.slice(adminIndex + 1) : [];
  const breadcrumb = ["概览"];

  for (const segment of tail) {
    const label = SECTION_LABELS[segment] ?? ACTION_LABELS[segment];
    if (!label) continue;
    if (breadcrumb[breadcrumb.length - 1] !== label) {
      breadcrumb.push(label);
    }
  }

  return breadcrumb;
}
