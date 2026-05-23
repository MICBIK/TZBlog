import { render, screen } from "@testing-library/react";
import type { ComponentType } from "react";
import { describe, expect, it, vi } from "vitest";

const aboutContactModulePath = "./AboutContact";

describe("<AboutContact />", () => {
  it("AboutContact renders mailto + external links", async () => {
    const { container } = render(
      await aboutContact({
        email: "hello@example.com",
        links: [
          {
            label: "GitHub",
            href: "https://github.com/ha1den",
            kind: "github",
          },
          {
            label: "RSS",
            href: "/rss.xml",
            kind: "rss",
          },
        ],
      }),
    );

    expect(screen.getByText("CONTACT")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Contact" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "hello@example.com" })).toHaveAttribute(
      "href",
      "mailto:hello@example.com",
    );
    expect(screen.getByRole("link", { name: "GitHub" })).toHaveAttribute(
      "target",
      "_blank",
    );
    expect(screen.getByRole("link", { name: "GitHub" })).toHaveAttribute(
      "rel",
      "noopener noreferrer",
    );
    expect(container.querySelector("ul")).toBeInTheDocument();
  });

  it("uses the shared panel container and accent hover links", async () => {
    const { container } = render(
      await aboutContact({
        email: "hello@example.com",
        links: [
          {
            label: "GitHub",
            href: "https://github.com/ha1den",
            kind: "github",
          },
        ],
      }),
    );

    expect(container.querySelector("section.launch-panel")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "hello@example.com" })).toHaveClass(
      "hover:text-accent",
    );
    expect(screen.getByRole("link", { name: "GitHub" })).toHaveClass(
      "hover:text-accent",
    );
  });
});

async function aboutContact(props: {
  email: string;
  links: Array<{
    label: string;
    href: string;
    kind: "github" | "x" | "rss" | "other";
  }>;
}) {
  const { AboutContact } = (await vi.importActual(aboutContactModulePath)) as {
    AboutContact: ComponentType<typeof props>;
  };

  return <AboutContact {...props} />;
}
