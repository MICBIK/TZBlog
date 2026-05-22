import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("README sanity", () => {
  it("does not contain create-next-app boilerplate", async () => {
    const content = await readFile(join(process.cwd(), "README.md"), "utf-8");

    expect(content).not.toContain("bootstrapped with [`create-next-app`]");
    expect(content).not.toContain(
      "You can start editing the page by modifying `app/page.tsx`",
    );
    expect(content).not.toContain("Deploy on Vercel");
  });

  it("contains project identity markers", async () => {
    const content = await readFile(join(process.cwd(), "README.md"), "utf-8");

    expect(content).toContain("TZBlog");
    expect(content).toMatch(/MinIO|S3/);
    expect(content).toMatch(/Docker Compose|VPS|Caddy/);
  });
});
