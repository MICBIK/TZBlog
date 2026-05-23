import { render, screen } from "@testing-library/react";
import type { ComponentType } from "react";
import { describe, expect, it, vi } from "vitest";

const aboutProjectIntentModulePath = "./AboutProjectIntent";

describe("<AboutProjectIntent />", () => {
  it("renders Why exists / Who for / What it isn't sections", async () => {
    const { container } = render(
      await aboutProjectIntent({
        sections: [
          {
            heading: "Why this exists",
            body:
              "TZBlog avoids Substack, Ghost, and Notion because the CMS, analytics, and deployment path need to stay inspectable.",
          },
          {
            heading: "Who it's for",
            body:
              "It is for engineers thinking about ownership, tradeoffs, and tools.",
          },
          {
            heading: "What it isn't",
            body:
              "It is not marketing, not SEO nesting, and not a paid wall.",
          },
        ],
      }),
    );

    expect(
      screen.getByRole("heading", { level: 2, name: "Why this site exists" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Why this exists" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Who it's for" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "What it isn't" })).toBeInTheDocument();
    expect(container.querySelectorAll("article")).toHaveLength(3);
    expect(container.querySelector("p.max-w-\\[65ch\\]")).toBeInTheDocument();
  });

  it("contains 3+ concrete facts", async () => {
    render(
      await aboutProjectIntent({
        sections: [
          {
            heading: "Why this exists",
            body:
              "TZBlog has a self-built CMS completed in 8 days and avoids Substack, Ghost, and Notion.",
          },
          {
            heading: "Who it's for",
            body:
              "It targets engineers running a Next.js 16, PostgreSQL 16, and MinIO stack on a Hetzner CX22 4GB VPS.",
          },
          {
            heading: "What it isn't",
            body:
              "The source stays reviewable under the repository LICENSE instead of hiding behind a paid wall.",
          },
        ],
      }),
    );

    const text = document.body.textContent ?? "";
    const concreteFacts = [
      /8 days/,
      /Hetzner CX22 4GB VPS/,
      /LICENSE/,
      /Next\.js 16/,
      /PostgreSQL 16/,
      /MinIO/,
    ].filter((pattern) => pattern.test(text));

    expect(concreteFacts.length).toBeGreaterThanOrEqual(3);
  });
});

async function aboutProjectIntent(props: {
  sections: Array<{
    heading: string;
    body: string;
  }>;
}) {
  const { AboutProjectIntent } = (await vi.importActual(
    aboutProjectIntentModulePath,
  )) as {
    AboutProjectIntent: ComponentType<typeof props>;
  };

  return <AboutProjectIntent {...props} />;
}
