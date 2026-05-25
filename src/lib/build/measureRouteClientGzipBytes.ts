import { readFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import { join } from "node:path";

export const HOME_ROUTE_CLIENT_MANIFEST_KEY = "(site)/page";
export const HOME_CLIENT_GZIP_LIMIT_BYTES = 250 * 1024;

interface BuildManifest {
  rootMainFiles?: string[];
  polyfillFiles?: string[];
}

interface ClientReferenceManifest {
  entryJSFiles?: Record<string, string[]>;
}

function parseClientReferenceManifest(source: string): ClientReferenceManifest {
  const match = source.match(/=\s*(\{[\s\S]*\});?\s*$/);
  if (!match) {
    throw new Error("Unable to parse client-reference manifest");
  }

  return JSON.parse(match[1]) as ClientReferenceManifest;
}

export async function measureRouteClientGzipBytes(
  routeKey: string,
  rootDir = process.cwd(),
): Promise<number> {
  const buildManifestPath = join(
    rootDir,
    ".next/server/app",
    routeKey,
    "build-manifest.json",
  );
  const clientManifestPath = join(
    rootDir,
    ".next/server/app",
    `${routeKey}_client-reference-manifest.js`,
  );

  const pageBuild = JSON.parse(
    await readFile(buildManifestPath, "utf8"),
  ) as BuildManifest;
  const pageClient = parseClientReferenceManifest(
    await readFile(clientManifestPath, "utf8"),
  );

  const chunks = new Set<string>();
  for (const file of pageBuild.rootMainFiles ?? []) chunks.add(file);
  for (const file of pageBuild.polyfillFiles ?? []) chunks.add(file);
  for (const files of Object.values(pageClient.entryJSFiles ?? {})) {
    for (const file of files) chunks.add(file);
  }

  let total = 0;
  for (const rel of chunks) {
    const bytes = await readFile(join(rootDir, ".next", rel));
    total += gzipSync(bytes).length;
  }

  return total;
}
