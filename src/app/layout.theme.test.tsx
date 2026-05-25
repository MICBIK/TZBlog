import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/font/google", () => {
  const fontStub = () => ({ variable: "--font-stub" });
  return { Geist: fontStub, Geist_Mono: fontStub, Inter: fontStub, Source_Serif_4: fontStub };
});

describe("RootLayout theme tokens", () => {
  it("rootLayoutSetsHtmlAuroraTheme", async () => {
    const { default: RootLayout } = await import("./layout");
    render(<RootLayout><p>child</p></RootLayout>);
    expect(document.documentElement).toHaveAttribute("data-theme", "aurora");
  });
});
