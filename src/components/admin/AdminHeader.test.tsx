import { readFileSync } from "node:fs";
import { join } from "node:path";
import { render, screen } from "@testing-library/react";
import type { ComponentType } from "react";
import { describe, expect, it, vi } from "vitest";

interface AdminHeaderProps {
  email?: string | null;
  signOutAction: () => void | Promise<void>;
}

const mocks = vi.hoisted(() => ({
  pathname: "/admin/entries/new",
}));

vi.mock("next/navigation", () => ({
  usePathname: () => mocks.pathname,
}));

vi.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => (
    <div role="menu">{children}</div>
  ),
  DropdownMenuItem: ({ children }: { children: React.ReactNode }) => (
    <div role="menuitem">{children}</div>
  ),
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

describe("AdminHeader", () => {
  it("renders a Chinese breadcrumb from the current admin path", async () => {
    const { AdminHeader } = await loadAdminHeader();

    render(<AdminHeader email="admin@example.com" signOutAction={vi.fn()} />);

    expect(screen.getByLabelText("后台路径")).toHaveTextContent(
      "概览 / 文章 / 新建",
    );
  });

  it("renders the user dropdown trigger and logout item", async () => {
    const { AdminHeader } = await loadAdminHeader();

    render(<AdminHeader email="admin@example.com" signOutAction={vi.fn()} />);

    expect(
      screen.getByRole("button", { name: "admin@example.com" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "登出" })).toBeInTheDocument();
  });

  it("AdminLayout delegates header rendering to AdminHeader", () => {
    const source = readFileSync(
      join(process.cwd(), "src/app/(admin)/admin/layout.tsx"),
      "utf-8",
    );

    expect(source).toContain("<AdminHeader");
  });
});

async function loadAdminHeader(): Promise<{
  AdminHeader: ComponentType<AdminHeaderProps>;
}> {
  const modulePath = "./AdminHeader";
  return (await import(modulePath)) as {
    AdminHeader: ComponentType<AdminHeaderProps>;
  };
}
