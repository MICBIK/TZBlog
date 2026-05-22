import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { aboutContent } from "@/lib/content/about";

import AboutPage, * as aboutPageModule from "./page";

const pageExports = aboutPageModule as {
  metadata?: {
    title?: string;
    description?: string;
    openGraph?: {
      title?: string;
      description?: string;
    };
  };
};

describe("AboutPage", () => {
  it("AboutPage renders 4 sections in order", async () => {
    render(await AboutPage());

    const heroHeading = screen.getByRole("heading", {
      level: 1,
      name: aboutContent.hero.headline,
    });
    const nowHeading = screen.getByRole("heading", { level: 2, name: "Now" });
    const storyHeading = screen.getByRole("heading", { level: 2, name: "Story" });
    const contactHeading = screen.getByRole("heading", {
      level: 2,
      name: "Contact",
    });

    expect(heroHeading).toBeInTheDocument();
    expect(aboutContent.now.items[0].label).toBe("Shipping");
    expect(screen.getByText(aboutContent.now.items[0].label)).toBeInTheDocument();
    expect(screen.getByText(aboutContent.story.paragraphs[0])).toBeInTheDocument();
    expect(screen.getByRole("link", { name: aboutContent.contact.email })).toBeInTheDocument();
    expect(
      heroHeading.compareDocumentPosition(nowHeading) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      nowHeading.compareDocumentPosition(storyHeading) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      storyHeading.compareDocumentPosition(contactHeading) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("AboutPage exports metadata with title + description", () => {
    expect(pageExports.metadata?.title).toBe("About");
    expect(pageExports.metadata?.description).toBeTruthy();
    expect(pageExports.metadata?.openGraph?.title).toBe("About — TZBlog");
    expect(pageExports.metadata?.openGraph?.description).toBe(aboutContent.hero.lead);
  });

  it("AboutPage uses semantic headings (1 h1, 3 h2)", async () => {
    const { container } = render(await AboutPage());

    expect(container.querySelector("article")).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(3);
    expect(container.querySelectorAll("section[aria-labelledby]")).toHaveLength(4);
  });
});
