import { access, readFile } from "node:fs/promises";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

async function exists(path: string): Promise<boolean> {
  try {
    await access(join(process.cwd(), path));
    return true;
  } catch {
    return false;
  }
}

describe("prelaunch readiness", () => {
  it("proxyEntrypointReplacesMiddleware", async () => {
    expect(await exists("src/proxy.ts")).toBe(true);
    expect(await exists("src/middleware.ts")).toBe(false);

    const proxy = await readFile(join(process.cwd(), "src/proxy.ts"), "utf-8");
    expect(proxy).toContain("NextAuth(authConfig)");
    expect(proxy).toContain('matcher: ["/admin/:path*", "/api/admin/:path*"]');
  });

  it("prismaSchemaDoesNotUseDeprecatedDriverAdaptersPreview", async () => {
    const schema = await readFile(
      join(process.cwd(), "prisma/schema.prisma"),
      "utf-8",
    );

    expect(schema).not.toContain("previewFeatures");
    expect(schema).not.toContain("driverAdapters");
  });
});
