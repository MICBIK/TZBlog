import { afterEach, describe, expect, it, vi } from "vitest";
import type { MetadataRoute } from "next";

afterEach(() => {
  vi.resetModules();
  vi.doUnmock("@/lib/env");
});

describe("robots", () => {
  it('returns rules with userAgent="*", allow="/", disallow /admin + /api', async () => {
    vi.doMock("@/lib/env", () => ({
      env: { SITE_URL: "https://tzblog.example.com" },
    }));

    const { default: robots } = await importRobots();

    expect(robots().rules).toEqual([
      { userAgent: "*", allow: "/", disallow: ["/admin", "/api"] },
    ]);
  });

  it('sitemap field uses absoluteUrl("/sitemap.xml")', async () => {
    vi.doMock("@/lib/env", () => ({
      env: { SITE_URL: "https://tzblog.example.com/" },
    }));

    const { default: robots } = await importRobots();

    expect(robots().sitemap).toBe("https://tzblog.example.com/sitemap.xml");
  });
});

async function importRobots(): Promise<{
  default: () => MetadataRoute.Robots;
}> {
  const modulePath = "./" + "robots";
  return (await import(modulePath)) as {
    default: () => MetadataRoute.Robots;
  };
}
