import { existsSync } from "node:fs";
import { join } from "node:path";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SiteHeader } from "./SiteHeader";

describe("<SiteHeader /> i18n current state", () => {
  it("renders Chinese navigation labels for the single-locale site", () => {
    render(<SiteHeader />);

    expect(screen.getByRole("link", { name: "文章" })).toHaveAttribute(
      "href",
      "/posts",
    );
    expect(screen.getByRole("link", { name: "专栏" })).toHaveAttribute(
      "href",
      "/columns",
    );
    expect(screen.getByRole("link", { name: "关于" })).toHaveAttribute(
      "href",
      "/about",
    );
    expect(screen.queryByRole("link", { name: "Blog" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Columns" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "About" })).not.toBeInTheDocument();
  });

  it("does not expose a fake language switcher", () => {
    const { container } = render(<SiteHeader />);

    expect(container.querySelector("select")).not.toBeInTheDocument();
    expect(screen.queryByText("English")).not.toBeInTheDocument();
    expect(screen.queryByText("中文 / English")).not.toBeInTheDocument();
    expect(container.querySelector('a[href="/en"]')).not.toBeInTheDocument();
  });

  it("links only to existing public pages", () => {
    render(<SiteHeader />);

    const routes = [
      ["文章", "src/app/(site)/posts/page.tsx"],
      ["专栏", "src/app/(site)/columns/page.tsx"],
      ["关于", "src/app/(site)/about/page.tsx"],
    ] as const;

    for (const [label, path] of routes) {
      expect(screen.getByRole("link", { name: label })).toBeInTheDocument();
      expect(existsSync(join(process.cwd(), path)), path).toBe(true);
    }
  });
});
