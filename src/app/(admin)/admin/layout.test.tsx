import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("AdminLayout contrast tokens", () => {
  const layoutSource = readFileSync(
    join(process.cwd(), "src/app/(admin)/admin/layout.tsx"),
    "utf-8",
  );
  const headerSource = readFileSync(
    join(process.cwd(), "src/components/admin/AdminHeader.tsx"),
    "utf-8",
  );
  const sidebarSource = readFileSync(
    join(process.cwd(), "src/components/admin/AdminSidebar.tsx"),
    "utf-8",
  );
  const delegatedSource = `${layoutSource}\n${headerSource}\n${sidebarSource}`;

  it("AdminLayout uses foreground tokens for sidebar and header text", () => {
    expect(delegatedSource).toContain("text-muted-fg");
    expect(delegatedSource).toContain("text-fg");
    expect(delegatedSource).not.toContain("text-[hsl(var(--muted))]");
  });

  it("AdminLayout hover and focus states preserve readable foreground tokens", () => {
    expect(delegatedSource).toContain("hover:bg-muted");
    expect(delegatedSource).toContain("hover:text-fg");
    expect(delegatedSource).toContain("focus-visible:ring-ring");
    expect(delegatedSource).not.toContain("hover:bg-[hsl(var(--accent))]/10");
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
