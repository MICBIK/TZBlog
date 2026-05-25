import { describe, expect, it } from "vitest";

import { LAYOUT_MOTION_CLASS } from "./_shared";

describe("channel layout shared motion", () => {
  it("reducedMotionDisablesAllLayoutAnimations", () => {
    expect(LAYOUT_MOTION_CLASS).toContain("motion-reduce:transition-none");
    expect(LAYOUT_MOTION_CLASS).toContain("motion-reduce:transform-none");
  });
});
