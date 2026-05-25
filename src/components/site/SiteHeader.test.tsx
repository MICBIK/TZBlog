import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { HeaderChannel } from "@/lib/navigation/publicNav";
import { SITE_META } from "@/lib/site-meta";

import { SiteHeader } from "./SiteHeader";

const orderedChannels: HeaderChannel[] = [
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

const sampleChannels: HeaderChannel[] = [
  ...orderedChannels.slice(0, 2),
  {
    slug: "guestbook",
    kind: "GUESTBOOK",
    enabled: true,
    order: 2,
    translations: [{ locale: "zh", name: "留言板" }],
  },
  orderedChannels[2],
];

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
    render(<SiteHeader channels={orderedChannels} />);

    const nav = screen.getByRole("navigation", { name: "主导航" });
    const links = within(nav).getAllByRole("link");

    expect(links.map((link) => [link.textContent, link.getAttribute("href")])).toEqual([
      ["文章", "/c/articles"],
      ["日志流", "/c/stream"],
      ["关于", "/about"],
    ]);
  });

  it("navIncludesGuestbookLinkWhenEnabled", () => {
    const { container } = render(<SiteHeader channels={sampleChannels} />);

    expect(screen.getByRole("link", { name: "留言板" })).toHaveAttribute(
      "href",
      "/guestbook",
    );
    expect(container.querySelector('a[href="/c/guestbook"]')).not.toBeInTheDocument();
  });
});
