import { describe, expect, it } from "vitest";

import { createChannelSchema } from "./channel";

describe("createChannelSchema", () => {
  it("invalidSlugFailsZodValidation", () => {
    const result = createChannelSchema.safeParse({
      slug: "Bad Slug",
      kind: "ARTICLES",
      layout: "CHRONICLE",
      enabled: true,
      translations: [{ locale: "zh", name: "文章", description: null }],
    });

    expect(result.success).toBe(false);
  });
});
