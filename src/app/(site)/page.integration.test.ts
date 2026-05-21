import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("HomePage TechStack integration", () => {
  const source = readFileSync(
    join(process.cwd(), "src/app/(site)/page.tsx"),
    "utf-8",
  );

  it("no longer contains terminal-style techStack const", () => {
    expect(source).not.toMatch(/const techStack\s*=/);
    expect(source).not.toMatch(/\$\s*<\/span>\s*whoami/);
  });

  it("imports and renders TechStack component", () => {
    expect(source).toMatch(
      /import\s+\{\s*TechStack\s*\}\s+from\s+"@\/components\/site\/TechStack"/,
    );
    expect(source).toMatch(/<TechStack\s*\/>/);
  });
});
