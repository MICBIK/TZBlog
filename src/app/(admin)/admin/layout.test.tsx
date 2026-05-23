import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("AdminLayout contrast tokens", () => {
  const layoutSource = readFileSync(
    join(process.cwd(), "src/app/(admin)/admin/layout.tsx"),
    "utf-8",
  );
  const sidebarSource = readFileSync(
    join(process.cwd(), "src/components/admin/AdminSidebar.tsx"),
    "utf-8",
  );

  it("AdminLayout uses foreground tokens for sidebar and header text", () => {
    expect(layoutSource).toContain("text-muted-fg");
    expect(layoutSource).toContain("text-fg");
    expect(layoutSource).not.toContain("text-[hsl(var(--muted))]");
  });

  it("AdminLayout hover and focus states preserve readable foreground tokens", () => {
    expect(layoutSource).toContain("hover:bg-muted");
    expect(layoutSource).toContain("hover:text-fg");
    expect(layoutSource).toContain("focus-visible:ring-ring");
    expect(layoutSource).not.toContain("hover:bg-[hsl(var(--accent))]/10");
  });

  it("AdminLayout delegates navigation to AdminSidebar and removes dead links", () => {
    expect(layoutSource).toContain("<AdminSidebar");
    expect(layoutSource).not.toContain("/admin/analytics");
    expect(layoutSource).not.toContain("/admin/settings");
    expect(layoutSource).not.toContain("/admin/_editor-demo");
    expect(sidebarSource).not.toContain("/admin/analytics");
    expect(sidebarSource).not.toContain("/admin/settings");
    expect(sidebarSource).not.toContain("/admin/_editor-demo");
  });
});
