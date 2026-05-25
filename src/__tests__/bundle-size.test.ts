import { access } from "node:fs/promises";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  HOME_CLIENT_GZIP_LIMIT_BYTES,
  HOME_ROUTE_CLIENT_MANIFEST_KEY,
  measureRouteClientGzipBytes,
} from "@/lib/build/measureRouteClientGzipBytes";

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

describe("home bundle size", () => {
  it("homeBundleUnder250kbGzip", async () => {
    const buildManifestPath = join(
      process.cwd(),
      ".next/server/app",
      HOME_ROUTE_CLIENT_MANIFEST_KEY,
      "build-manifest.json",
    );

    if (!(await exists(buildManifestPath))) {
      throw new Error(
        "Missing .next build output. Run `pnpm build` before bundle-size tests.",
      );
    }

    const gzipBytes = await measureRouteClientGzipBytes(
      HOME_ROUTE_CLIENT_MANIFEST_KEY,
    );

    expect(gzipBytes).toBeLessThan(HOME_CLIENT_GZIP_LIMIT_BYTES);
  });
});
