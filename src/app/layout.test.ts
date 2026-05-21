import { afterEach, describe, expect, it, vi } from "vitest";
import type { Metadata } from "next";

vi.mock("next/font/google", () => ({
  Geist: () => ({ variable: "--font-geist-sans" }),
  Geist_Mono: () => ({ variable: "--font-geist-mono" }),
}));

afterEach(() => {
  vi.resetModules();
  vi.doUnmock("@/lib/env");
});

describe("root metadata", () => {
  it("sets metadataBase from env.SITE_URL and site-wide OpenGraph defaults", async () => {
    vi.doMock("@/lib/env", () => ({
      env: { SITE_URL: "https://tzblog.example.com" },
    }));

    const { metadata } = await importLayout();

    expect(metadata.metadataBase?.toString()).toBe(
      "https://tzblog.example.com/",
    );
    expect(metadata.openGraph).toMatchObject({
      type: "website",
      siteName: "TZBlog",
      locale: "zh_CN",
    });
  });
});

async function importLayout(): Promise<{ metadata: Metadata }> {
  const modulePath = "./" + "layout";
  return (await import(modulePath)) as { metadata: Metadata };
}
