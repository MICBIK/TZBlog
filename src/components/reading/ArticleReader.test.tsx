import { readFileSync } from "node:fs";
import { join } from "node:path";

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ThemeProvider } from "@/components/theme/ThemeProvider";
import type { TocHeading } from "@/lib/markdown";
import { resolveFontProse } from "@/lib/theme/font";

import { ArticleReader } from "./ArticleReader";

vi.mock("./ReadingProgress", () => ({
  ReadingProgress: () => <div data-testid="reading-progress" />,
}));

vi.mock("./Toc", () => ({
  Toc: ({ contentLength }: { contentLength: number }) =>
    contentLength > 1000 ? <nav data-testid="reading-toc">TOC</nav> : null,
}));

vi.mock("@/components/markdown/MarkdownCopyButtons", () => ({
  MarkdownCopyButtons: () => <div data-testid="markdown-copy-buttons" />,
}));

const headings: TocHeading[] = [{ id: "section", text: "Section", level: 2 }];

function renderReader(
  html: string,
  overrides: Partial<Parameters<typeof ArticleReader>[0]> = {},
) {
  return render(
    <ThemeProvider theme="ink">
      <ArticleReader
        title="Ink Article"
        titleId="post-title-ink"
        html={html}
        headings={headings}
        contentLength={1500}
        author="HaiDen"
        publishedAt={new Date("2026-05-21T00:00:00Z")}
        wordCount={1280}
        viewCount={42}
        slug="ink-article"
        postId="post-id"
        likeButton={<button type="button">Like</button>}
        commentSection={<section>Comments</section>}
        {...overrides}
      />
    </ThemeProvider>,
  );
}

beforeEach(() => {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      matches: query === "(prefers-reduced-motion: reduce)",
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );
});

describe("ArticleReader", () => {
  const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf-8");

  it("rendersInkThemeWithSerifFontAnd52chWidth", () => {
    const { container } = renderReader("<p>正文</p>");

    const reader = screen.getByRole("article");
    const column = reader.querySelector(":scope > div");
    expect(reader).toHaveAttribute("data-article-reader");
    expect(reader.closest("[data-theme='ink']")).toBeTruthy();
    expect(column).toHaveClass("max-w-[52ch]");
    expect(reader).toHaveStyle({ fontFamily: resolveFontProse("ink") });
    expect(container.querySelector("[data-article-content]")).toHaveClass(
      "markdown-body",
    );
  });

  it("footerShowsVermilionSeal", () => {
    renderReader("<p>正文</p>");

    const seal = screen.getByText("■");
    expect(seal).toHaveAttribute("data-vermilion-seal");
    expect(seal).toHaveClass("text-accent");
    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveTextContent("HaiDen");
    expect(footer).toHaveTextContent("2026-05-21");
    expect(footer).toHaveTextContent("1280 字");
  });

  it("chineseParagraphsHaveNoFirstLineIndent", () => {
    expect(css).toMatch(
      /\[data-theme="ink"\]\s+\[data-article-reader\][\s\S]*text-indent:\s*0/,
    );
  });

  it("h2HasFourEmTopMargin", () => {
    expect(css).toMatch(
      /\[data-theme="ink"\]\s+\[data-article-reader\][\s\S]*\.markdown-body h2[\s\S]*margin-top:\s*4em/,
    );
  });

  it("blockquoteShowsVermilionQuoteMark", () => {
    expect(css).toMatch(
      /\[data-theme="ink"\]\s+\[data-article-reader\][\s\S]*blockquote::before[\s\S]*color:\s*hsl\(var\(--accent\)\)/,
    );
  });

  it("codeFenceShowsShikiHighlightAndCopyButton", () => {
    const { container } = renderReader(`
      <figure class="code-block" data-language="ts">
        <figcaption class="code-block-chrome">
          <span class="code-block-language">TS</span>
          <button class="code-block-copy" data-copy aria-label="复制代码" type="button">Copy</button>
        </figcaption>
        <pre class="shiki"><code>const x = 1;</code></pre>
      </figure>
    `);

    expect(container.querySelector('figure.code-block[data-language="ts"]')).toBeInTheDocument();
    expect(container.querySelector(".shiki")).toBeInTheDocument();
    expect(container.querySelector(".code-block-copy[data-copy]")).toBeInTheDocument();
    expect(screen.getByTestId("markdown-copy-buttons")).toBeInTheDocument();
  });

  it("ghAlertRendersWithIconAndColor", () => {
    const { container } = renderReader(`
      <div class="markdown-alert markdown-alert-warning">
        <p class="markdown-alert-title"><svg class="markdown-alert-icon"></svg><span class="markdown-alert-label">Warning</span></p>
        <p>Be careful.</p>
      </div>
    `);

    expect(container.querySelector(".markdown-alert-warning")).toBeInTheDocument();
    expect(container.querySelector(".markdown-alert-icon")).toBeInTheDocument();
    expect(container.querySelector(".markdown-alert-label")).toHaveTextContent(
      "Warning",
    );
  });

  it("reducedMotionDisablesParagraphFade", () => {
    expect(css).toMatch(
      /@media \(prefers-reduced-motion: reduce\)[\s\S]*\[data-theme="ink"\]\s+\[data-article-reader\][\s\S]*\.markdown-body > p[\s\S]*animation:\s*none/,
    );

    renderReader("<p>正文</p>");

    expect(screen.getByRole("article")).toHaveAttribute(
      "data-reduced-motion-safe",
    );
  });
});
