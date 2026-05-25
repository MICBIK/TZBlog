import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

describe("theme guards", () => {
  it("noChannelThemeFieldInPrismaSchema", () => {
    const schema = readFileSync(
      join(process.cwd(), "prisma/schema.prisma"),
      "utf8",
    );
    expect(schema).not.toMatch(/^\s*theme\s+/m);
  });
});
