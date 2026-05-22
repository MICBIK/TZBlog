import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("AdminLayout contrast tokens", () => {
  const source = readFileSync(
    join(process.cwd(), "src/app/(admin)/admin/layout.tsx"),
    "utf-8",
  );

  it("AdminLayout uses foreground tokens for sidebar and header text", () => {
    expect(source).toContain("text-muted-fg");
    expect(source).toContain("text-fg");
    expect(source).not.toContain("text-[hsl(var(--muted))]");
  });

  it("AdminLayout hover and focus states preserve readable foreground tokens", () => {
    expect(source).toContain("hover:bg-muted");
    expect(source).toContain("hover:text-fg");
    expect(source).toContain("focus-visible:ring-ring");
    expect(source).not.toContain("hover:bg-[hsl(var(--accent))]/10");
  });
});
