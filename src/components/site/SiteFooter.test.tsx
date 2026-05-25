import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SITE_META } from "@/lib/site-meta";

import { SiteFooter } from "./SiteFooter";

describe("<SiteFooter /> public shell", () => {
  it("rendersColophonWithAuthorRssLink", () => {
    render(<SiteFooter />);

    expect(screen.getByText(SITE_META.description)).toBeInTheDocument();
    expect(screen.getByText(SITE_META.author)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`© ${new Date().getFullYear()} ${SITE_META.author}`))).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /RSS/i })).toHaveAttribute("href", "/rss.xml");
  });
});
