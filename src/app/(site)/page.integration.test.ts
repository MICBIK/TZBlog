import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("HomePage IA integration", () => {
  const source = readFileSync(
    join(process.cwd(), "src/app/(site)/page.tsx"),
    "utf-8",
  );

  it("loads home data through HomePageContent instead of legacy TechStack const", () => {
    expect(source).not.toMatch(/const techStack\s*=/);
    expect(source).toMatch(/getHomePageData/);
    expect(source).toMatch(/<HomePageContent data=\{data\} \/>/);
  });

  it("wraps the homepage in the aurora theme provider", () => {
    expect(source).toMatch(/<ThemeProvider theme="aurora" hero>/);
  });
});
