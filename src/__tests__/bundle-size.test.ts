import { access, readFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const HOME_ROUTE_KEY = "(site)/page";
const HOME_GZIP_LIMIT_BYTES = 100 * 1024;

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function measureHomeClientGzipBytes(): Promise<number> {
  const root = process.cwd();
  const buildManifestPath = join(
    root,
    ".next/server/app",
    HOME_ROUTE_KEY,
    "build-manifest.json",
  );
  const clientManifestPath = join(
    root,
    ".next/server/app",
    `${HOME_ROUTE_KEY}_client-reference-manifest.js`,
  );

  const pageBuild = JSON.parse(await readFile(buildManifestPath, "utf8")) as {
    rootMainFiles?: string[];
    polyfillFiles?: string[];
  };
  const clientText = await readFile(clientManifestPath, "utf8");
  const clientMatch = clientText.match(/=\s*(\{[\s\S]*\});?\s*$/);
  if (!clientMatch) {
    throw new Error("Unable to parse home client-reference manifest");
  }
  const pageClient = JSON.parse(clientMatch[1]) as {
    entryJSFiles?: Record<string, string[]>;
  };

  const chunks = new Set<string>();
  for (const file of pageBuild.rootMainFiles ?? []) chunks.add(file);
  for (const file of pageBuild.polyfillFiles ?? []) chunks.add(file);
  for (const files of Object.values(pageClient.entryJSFiles ?? {})) {
    for (const file of files) chunks.add(file);
  }

  let total = 0;
  for (const rel of chunks) {
    const bytes = await readFile(join(root, ".next", rel));
    total += gzipSync(bytes).length;
  }

  return total;
}

describe("home bundle size", () => {
  it("homeBundleUnder250kbGzip", async () => {
    const buildManifestPath = join(
      process.cwd(),
      ".next/server/app",
      HOME_ROUTE_KEY,
      "build-manifest.json",
    );

    if (!(await exists(buildManifestPath))) {
      throw new Error(
        "Missing .next build output. Run `pnpm build` before bundle-size tests.",
      );
    }

    const gzipBytes = await measureHomeClientGzipBytes();
    expect(gzipBytes).toBeLessThan(HOME_GZIP_LIMIT_BYTES);
  });
});
