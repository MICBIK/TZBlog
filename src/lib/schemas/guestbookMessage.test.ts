import { describe, expect, it } from "vitest";

import { guestbookMessageSchema } from "./guestbookMessage";

describe("guestbookMessageSchema gb-011", () => {
  it("rejectsMessageOver2000Chars", () => {
    const result = guestbookMessageSchema.safeParse({
      content: "a".repeat(2001),
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain("2000");
    }
  });
});
