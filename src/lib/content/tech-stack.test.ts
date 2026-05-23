import { describe, expect, it } from "vitest";

import { techStackCategories } from "./tech-stack";

describe("techStackCategories", () => {
  it("tech stack data has rationale string per item", () => {
    expect(techStackCategories).toHaveLength(5);

    for (const category of techStackCategories) {
      expect(category).toHaveProperty("category");
      expect(category.items.length).toBeGreaterThan(0);

      for (const item of category.items) {
        expect(item.name).toEqual(expect.any(String));
        expect(item.rationale).toEqual(expect.any(String));
        expect(item.rationale.length).toBeGreaterThan(12);
      }
    }
  });
});
