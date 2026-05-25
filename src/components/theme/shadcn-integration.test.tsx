import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Button } from "@/components/ui/button";
import { ThemeProvider } from "./ThemeProvider";

afterEach(() => {
  cleanup();
});

describe("shadcn theme integration", () => {
  it("shadcnButtonInheritsBgInAllThreeThemes", () => {
    for (const theme of ["aurora", "ink", "terminal"] as const) {
      const { unmount } = render(
        <ThemeProvider theme={theme}>
          <Button>Action</Button>
        </ThemeProvider>,
      );

      expect(screen.getByRole("button", { name: "Action" })).toHaveClass(
        "bg-primary",
      );
      unmount();
    }
  });

  it("terminalForcesZeroBorderRadius", () => {
    render(
      <ThemeProvider theme="terminal">
        <Button className="rounded-md">Terminal</Button>
      </ThemeProvider>,
    );

    expect(screen.getByRole("button", { name: "Terminal" })).toHaveClass(
      "rounded-md",
    );
    expect(
      screen.getByRole("button", { name: "Terminal" }).closest("[data-theme='terminal']"),
    ).toBeTruthy();
  });
});
