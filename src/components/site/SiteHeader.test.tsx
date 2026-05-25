import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { HeaderChannel } from "@/lib/navigation/publicNav";
import { SITE_META } from "@/lib/site-meta";

import { SiteHeader } from "./SiteHeader";

describe("<SiteHeader /> public shell", () => {
  it("rendersBrandAndNavAndAdminLink", () => {
    render(<SiteHeader channels={[]} />);

    expect(
      screen.getByRole("link", { name: SITE_META.name }),
    ).toHaveAttribute("href", "/");
    expect(screen.getByRole("navigation", { name: "主导航" })).toBeInTheDocument();

    const themeToggle = document.querySelector("[data-admin-theme-toggle]");
    expect(themeToggle).toBeInTheDocument();
    expect(themeToggle).toHaveAttribute("hidden");
  });
  it("navListsEnabledChannelsByOrder", () => {
    render(<SiteHeader channels={sampleChannels} />);

    const nav = screen.getByRole("navigation", { name: "主导航" });
    const links = within(nav).getAllByRole("link");

    expect(links.map((link) => [link.textContent, link.getAttribute("href")])).toEqual([
      ["文章", "/c/articles"],
      ["日志流", "/c/stream"],
      ["关于", "/about"],
    ]);
  });

});


const sampleChannels: HeaderChannel[] = [
  {
    slug: "articles",
    kind: "ARTICLES",
    enabled: true,
    order: 0,
    translations: [{ locale: "zh", name: "文章" }],
  },
  {
    slug: "stream",
    kind: "STREAM",
    enabled: true,
    order: 1,
    translations: [{ locale: "zh", name: "日志流" }],
  },
  {
    slug: "labs",
    kind: "ARTICLES",
    enabled: false,
    order: 3,
    translations: [{ locale: "zh", name: "实验室" }],
  },
];
