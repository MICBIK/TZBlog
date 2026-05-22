import "dotenv/config";

import type { Metadata } from "next";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/font/google", () => {
  const fontStub = () => ({ variable: "--font-stub" });
  return {
    Geist: fontStub,
    Geist_Mono: fontStub,
    Inter: fontStub,
    Source_Serif_4: fontStub,
  };
});

interface LayoutMetadata extends Metadata {
  metadataBase?: URL | string;
  title?:
    | string
    | { default: string; template: string }
    | { absolute: string }
    | null;
  openGraph?: {
    type?: string;
    siteName?: string;
    locale?: string;
    images?:
      | string
      | { url: string; width?: number; height?: number }
      | Array<{ url: string; width?: number; height?: number }>;
  };
  twitter?: {
    card?: string;
    title?: string | { default: string; template: string };
    description?: string;
    images?: string | string[] | { url: string } | Array<{ url: string }>;
  };
}

async function loadMetadata(): Promise<LayoutMetadata> {
  const mod = (await import("./layout")) as { metadata: LayoutMetadata };
  return mod.metadata;
}

describe("root layout metadata", () => {
  it("metadataBase is set + title has default + template", async () => {
    const metadata = await loadMetadata();

    expect(metadata.metadataBase).toBeInstanceOf(URL);
    const base = metadata.metadataBase as URL;
    expect(base.href).toBe("http://localhost:3000/");

    const title = metadata.title;
    expect(title).toBeTypeOf("object");
    const t = title as { default: string; template: string };
    expect(t.default).toBe("TZBlog");
    expect(t.template).toBe("%s · TZBlog");
  });

  it("openGraph defaults include type, siteName, locale, and image", async () => {
    const metadata = await loadMetadata();
    const og = metadata.openGraph;

    expect(og).toBeDefined();
    expect(og?.type).toBe("website");
    expect(og?.siteName).toBe("TZBlog");
    expect(og?.locale).toBe("zh_CN");

    const images = og?.images;
    expect(Array.isArray(images)).toBe(true);
    const first = (images as Array<{ url: string; width?: number; height?: number }>)[0];
    expect(first.url).toMatch(/opengraph-image|og-default/);
    expect(first.width).toBe(1200);
    expect(first.height).toBe(630);
  });

  it("twitter defaults include card, title, description, and image", async () => {
    const metadata = await loadMetadata();
    const twitter = metadata.twitter;

    expect(twitter).toBeDefined();
    expect(twitter?.card).toBe("summary_large_image");
    expect(twitter?.title).toBe("TZBlog");
    expect(twitter?.description).toBeTruthy();

    const images = twitter?.images;
    expect(images).toBeDefined();
    const arr = Array.isArray(images) ? images : [images];
    expect(arr.length).toBeGreaterThan(0);
  });
});
