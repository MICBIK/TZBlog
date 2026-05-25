import "@testing-library/jest-dom/vitest";

const testEnvDefaults: Record<string, string> = {
  DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/tzblog",
  AUTH_SECRET: "test-secret-test-secret-test-secret",
  S3_ENDPOINT: "http://localhost:9000",
  S3_BUCKET: "tzblog-media",
  S3_ACCESS_KEY_ID: "minioadmin",
  S3_SECRET_ACCESS_KEY: "minioadmin",
  S3_PUBLIC_URL: "http://localhost:9000/tzblog-media",
  SITE_URL: "http://localhost:3000",
};
for (const [key, value] of Object.entries(testEnvDefaults)) { process.env[key] ??= value; }

import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

function createEmptyDomRect(): DOMRect {
  return {
    bottom: 0,
    height: 0,
    left: 0,
    right: 0,
    top: 0,
    width: 0,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  };
}

if (typeof Range !== "undefined") {
  if (!Range.prototype.getBoundingClientRect) {
    Object.defineProperty(Range.prototype, "getBoundingClientRect", {
      configurable: true,
      value: createEmptyDomRect,
    });
  }

  if (!Range.prototype.getClientRects) {
    Object.defineProperty(Range.prototype, "getClientRects", {
      configurable: true,
      value: () => [] as unknown as DOMRectList,
    });
  }
}

afterEach(() => cleanup());
