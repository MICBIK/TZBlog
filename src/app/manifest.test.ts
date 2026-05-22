import { describe, expect, it } from "vitest";

const manifestModulePath = "./manifest";

describe("manifest", () => {
  it("manifest() returns PWA basics", async () => {
    const { default: manifest } = await import(manifestModulePath);
    const result = manifest();

    expect(result.name).toBe("TZBlog");
    expect(result.short_name).toBe("TZBlog");
    expect(result.start_url).toBe("/");
    expect(result.display).toBe("standalone");
    expect(result.background_color).toEqual(expect.any(String));
    expect(result.theme_color).toEqual(expect.any(String));
    expect(result.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          src: "/icon.svg",
          type: "image/svg+xml",
        }),
      ]),
    );
  });
});
