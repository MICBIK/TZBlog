import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("AdminSidebar navigation", () => {
  const source = readFileSync(
    join(process.cwd(), "src/components/admin/AdminSidebar.tsx"),
    "utf-8",
  );

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
});
