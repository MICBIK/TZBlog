import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { aboutContent } from "@/lib/content/about";
import { getAboutPrinciples } from "@/lib/content/principles";

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
  it("renders 8 sections in order", async () => {
    const { container } = render(await AboutPage());

    const heroHeading = screen.getByRole("heading", {
      level: 1,
      name: aboutContent.hero.headline,
    });
    const nowHeading = screen.getByRole("heading", { level: 2, name: "Now" });
    const intentHeading = screen.getByRole("heading", {
      level: 2,
      name: "Why this site exists",
    });
    const techHeading = screen.getByRole("heading", {
      level: 2,
      name: "Technology choices",
    });
    const implementationHeading = screen.getByRole("heading", {
      level: 2,
      name: "Implementation approach",
    });
    const principlesHeading = screen.getByRole("heading", {
      level: 2,
      name: "Principles",
    });
    const roadmapHeading = screen.getByRole("heading", {
      level: 2,
      name: "Roadmap",
    });
    const contactHeading = screen.getByRole("heading", {
      level: 2,
      name: "Contact",
    });

    expect(heroHeading).toBeInTheDocument();
    expect(aboutContent.now.items[0].label).toBe("Shipping");
    expect(screen.getByText(aboutContent.now.items[0].label)).toBeInTheDocument();
    expect(screen.getByText("Why this exists")).toBeInTheDocument();
    expect(container.querySelector("section#tech-stack")).toBeInTheDocument();
    expect(screen.getByText("SDD + TDD micro-cycles")).toBeInTheDocument();
    expect(screen.getByText(getAboutPrinciples()[0]!.heading)).toBeInTheDocument();
    expect(screen.getByText(/中文单语言/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: aboutContent.contact.email })).toBeInTheDocument();

    expectInOrder([
      heroHeading,
      nowHeading,
      intentHeading,
      techHeading,
      implementationHeading,
      principlesHeading,
      roadmapHeading,
      contactHeading,
    ]);
    expect(container.querySelectorAll("article > section[aria-labelledby]")).toHaveLength(8);
  });

  it("AboutPage exports metadata with title + description", () => {
    expect(pageExports.metadata?.title).toBe("About");
    expect(pageExports.metadata?.description).toBeTruthy();
    expect(pageExports.metadata?.openGraph?.title).toBe("About — TZBlog");
    expect(pageExports.metadata?.openGraph?.description).toBe(aboutContent.hero.lead);
  });

  it("AboutPage uses semantic headings (1 h1, 7 h2)", async () => {
    const { container } = render(await AboutPage());

    expect(container.querySelector("article")).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(7);
    expect(container.querySelectorAll("article > section[aria-labelledby]")).toHaveLength(8);
  });

  it("contains i18n disclosure keywords and 6+ about principles", async () => {
    render(await AboutPage());

    expect(screen.getByText(/中文单语言/)).toBeInTheDocument();
    expect(screen.getByText(/数据模型预留/)).toBeInTheDocument();
    expect(screen.getByText(/V3/)).toBeInTheDocument();
    expect(getAboutPrinciples()).toHaveLength(8);
    expect(screen.getByText("Visible failure")).toBeInTheDocument();
  });
});

function expectInOrder(elements: HTMLElement[]) {
  for (let index = 0; index < elements.length - 1; index += 1) {
    expect(
      elements[index]!.compareDocumentPosition(elements[index + 1]!) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  }
}
