import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AdminSidebar } from "./AdminSidebar";

const mocks = vi.hoisted(() => ({
  pathname: "/admin",
}));

vi.mock("next/navigation", () => ({
  usePathname: () => mocks.pathname,
}));

beforeEach(() => {
  mocks.pathname = "/admin";
});

describe("AdminSidebar navigation", () => {
  const source = readFileSync(
    join(process.cwd(), "src/components/admin/AdminSidebar.tsx"),
    "utf-8",
  );

  it("excludes dead or sandbox-only admin routes from the final nav", () => {
    expect(source).not.toMatch(/href:\s*"\/admin\/analytics"/);
    expect(source).not.toMatch(/href:\s*"\/admin\/settings"/);
    expect(source).not.toMatch(/href:\s*"\/admin\/_editor-demo"/);
  });

  it("links only to existing admin pages", () => {
    const hrefs = Array.from(source.matchAll(/href:\s*"([^"]+)"/g)).map(
      ([, href]) => href,
    );

    expect(hrefs).toEqual([
      "/admin",
      "/admin/posts",
      "/admin/columns",
      "/admin/comments",
      "/admin/media",
    ]);
    expect(hrefs).not.toContain("/admin/analytics");
    expect(hrefs).not.toContain("/admin/settings");
    expect(hrefs).not.toContain("/admin/_editor-demo");

    for (const href of hrefs) {
      const routePath =
        href === "/admin"
          ? "src/app/(admin)/admin/page.tsx"
          : `src/app/(admin)${href}/page.tsx`;

      expect(existsSync(join(process.cwd(), routePath)), routePath).toBe(true);
    }
  });

  it("marks overview active only on the admin root", () => {
    mocks.pathname = "/admin";

    render(<AdminSidebar />);

    expect(screen.getByRole("link", { name: "概览" })).toHaveAttribute(
      "data-active",
      "true",
    );
    expect(screen.getByRole("link", { name: "文章" })).toHaveAttribute(
      "data-active",
      "false",
    );
  });

  it("marks posts active for nested post routes", () => {
    mocks.pathname = "/admin/posts/new";

    render(<AdminSidebar />);

    expect(screen.getByRole("link", { name: "文章" })).toHaveAttribute(
      "data-active",
      "true",
    );
    expect(screen.getByRole("link", { name: "概览" })).toHaveAttribute(
      "data-active",
      "false",
    );
  });

  it("marks media active by section prefix", () => {
    mocks.pathname = "/admin/media";

    render(<AdminSidebar />);

    expect(screen.getByRole("link", { name: "媒体" })).toHaveAttribute(
      "data-active",
      "true",
    );
    expect(screen.getByRole("link", { name: "评论" })).toHaveAttribute(
      "data-active",
      "false",
    );
  });
});
