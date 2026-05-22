import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MarkdownPreview } from "./MarkdownPreview";

const mocks = vi.hoisted(() => ({
  renderMarkdown: vi.fn(),
}));

vi.mock("@/lib/markdown", () => ({
  renderMarkdown: mocks.renderMarkdown,
}));

describe("<MarkdownPreview />", () => {
  it("MarkdownPreview uses markdown-body reading class", async () => {
    mocks.renderMarkdown.mockResolvedValue("<p>Rendered content</p>");

    render(await MarkdownPreview({ content: "Rendered content" }));

    const article = screen.getByText("Rendered content").closest("article");
    expect(article).toHaveClass("markdown-body");
    expect(article).toHaveClass("max-w-none");
    expect(article?.className).not.toContain("prose");
  });
});
