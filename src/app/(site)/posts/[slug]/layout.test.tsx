import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import PostSlugLayout from "./layout";

describe("PostSlugLayout public shell", () => {
  it("postPageHasNoAuroraLayer", () => {
    render(
      <PostSlugLayout>
        <div data-testid="post-root">post</div>
      </PostSlugLayout>,
    );

    const wrapper = screen.getByTestId("post-root").closest("[data-theme='ink']");
    expect(wrapper).toBeTruthy();
    expect(wrapper).not.toHaveAttribute("data-hero");
  });
});
