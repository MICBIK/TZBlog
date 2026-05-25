import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ThemeProvider } from "./ThemeProvider";

describe("ThemeProvider", () => {
  it("rootHasAuroraThemeByDefault", () => {
    render(
      <ThemeProvider theme="aurora">
        <p>content</p>
      </ThemeProvider>,
    );

    expect(screen.getByText("content").closest("[data-theme='aurora']")).toBeTruthy();
  });
});
