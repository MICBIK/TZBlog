import { describe, expect, it } from "vitest";

interface HeaderEntry {
  key: string;
  value: string;
}

interface HeaderRule {
  source: string;
  headers: HeaderEntry[];
}

async function getHeaderMap(): Promise<Record<string, string>> {
  const mod = (await import("../next.config")) as {
    default: { headers?: () => Promise<HeaderRule[]> | HeaderRule[] };
  };
  const config = mod.default;
  expect(typeof config.headers).toBe("function");
  const rules = await config.headers!();
  expect(Array.isArray(rules)).toBe(true);
  const globalRule = rules.find((rule) => rule.source === "/(.*)") ?? rules[0];
  return Object.fromEntries(
    globalRule.headers.map((h) => [h.key.toLowerCase(), h.value]),
  );
}

describe("next.config security headers", () => {
  it("SPEC-LH-H-1 emits HSTS / XFO / XCTO / Referrer-Policy / Permissions-Policy", async () => {
    const map = await getHeaderMap();

    expect(map["strict-transport-security"]).toMatch(
      /max-age=\d+/,
    );
    expect(map["x-frame-options"]).toBe("DENY");
    expect(map["x-content-type-options"]).toBe("nosniff");
    expect(map["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(map["permissions-policy"]).toBeDefined();
    expect(map["permissions-policy"]).toMatch(/camera|microphone|geolocation/);
  });

  it("SPEC-LH-H-2 emits Content-Security-Policy in Report-Only mode at launch", async () => {
    const map = await getHeaderMap();

    expect(map["content-security-policy-report-only"]).toBeDefined();
    const csp = map["content-security-policy-report-only"];

    expect(csp).toMatch(/default-src/);
    expect(csp).toMatch(/script-src/);
    expect(csp).toMatch(/'unsafe-inline'/);
    expect(csp).toMatch(/'unsafe-eval'/);
    expect(csp).toMatch(/style-src[^;]*'unsafe-inline'/);
    expect(csp).toMatch(/img-src[^;]*data:/);
    expect(csp).toMatch(/img-src[^;]*https:/);
    expect(csp).toMatch(/frame-ancestors\s+'none'/);

    expect(map["content-security-policy"]).toBeUndefined();
  });
});
