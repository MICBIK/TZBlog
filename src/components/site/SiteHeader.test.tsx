import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SITE_META } from "@/lib/site-meta";

import { SiteHeader } from "./SiteHeader";

describe("<SiteHeader /> public shell", () => {
  it("rendersBrandAndNavAndAdminLink", () => {
    // @ts-expect-error shell-001 RED: channels prop pending
    render(<SiteHeader channels={[]} />);

    expect(
      screen.getByRole("link", { name: SITE_META.name }),
    ).toHaveAttribute("href", "/");
    expect(screen.getByRole("navigation", { name: "主导航" })).toBeInTheDocument();

    const themeToggle = document.querySelector("[data-admin-theme-toggle]");
    expect(themeToggle).toBeInTheDocument();
    expect(themeToggle).toHaveAttribute("hidden");
  });
});
