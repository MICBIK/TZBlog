import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.resetModules();
  vi.doUnmock("@/lib/env");
});

describe("absoluteUrl", () => {
  it("trims trailing slash and normalizes leading slash", async () => {
    vi.doMock("@/lib/env", () => ({
      env: {
        SITE_URL: "https://example.com/",
      },
    }));

    const modulePath = "./" + "site-meta";
    const { absoluteUrl } = (await import(modulePath)) as {
      absoluteUrl(path: string): string;
    };

    expect(absoluteUrl("/posts")).toBe("https://example.com/posts");
    expect(absoluteUrl("posts")).toBe("https://example.com/posts");
    expect(absoluteUrl("/")).toBe("https://example.com/");
  });
});
