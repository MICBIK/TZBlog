import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderMarkdown } from "@/lib/markdown";
import { MarkdownEditorWithPreview } from "./MarkdownEditorWithPreview";

vi.mock("next/dynamic", () => ({
  default: () =>
    function DynamicMarkdownEditor() {
      return <div data-testid="dynamic-markdown-editor" />;
    },
}));

describe("Markdown editor preview parity", () => {
  it("matches renderMarkdown output for complex markdown", async () => {
    const markdown = [
      "## Preview parity",
      "",
      "> [!NOTE]",
      "> Keep source and preview aligned.",
      "",
      "```ts title=\"src/example.ts\"",
      "const value = 1;",
      "```",
      "",
      "| A | B |",
      "| - | - |",
      "| 1 | 2 |",
    ].join("\n");
    const expectedHtml = await renderMarkdown(markdown);

    render(<MarkdownEditorWithPreview value={markdown} onChange={vi.fn()} />);

    const article = screen.getByLabelText("Markdown 预览").querySelector("article");
    await waitFor(
      () => {
        expect(article?.innerHTML).toBe(expectedHtml);
      },
      { timeout: 5000 },
    );
  }, 10000);

  it("matches published output for all callout types", async () => {
    const markdown = [
      "> [!NOTE]",
      "> Note body.",
      "",
      "> [!TIP]",
      "> Tip body.",
      "",
      "> [!IMPORTANT]",
      "> Important body.",
      "",
      "> [!WARNING]",
      "> Warning body.",
      "",
      "> [!CAUTION]",
      "> Caution body.",
    ].join("\n");
    const expectedHtml = await renderMarkdown(markdown);

    render(<MarkdownEditorWithPreview value={markdown} onChange={vi.fn()} />);

    const article = screen.getByLabelText("Markdown 预览").querySelector("article");
    await waitFor(
      () => {
        expect(article?.innerHTML).toBe(expectedHtml);
      },
      { timeout: 5000 },
    );
  }, 10000);

  it("matches published output for code block chrome", async () => {
    await expectPreviewParity('```ts title="src/foo.ts"\nconst x = 1;\n```');
  }, 10000);

  it("matches published output for tables, nested lists, and blockquotes", async () => {
    await expectPreviewParity(
      [
        "| A | B |",
        "| - | - |",
        "| 1 | 2 |",
        "",
        "- item",
        "  - child",
        "",
        "> quote one",
        ">",
        "> quote two",
      ].join("\n"),
    );
  }, 10000);

  it("matches published output for links", async () => {
    await expectPreviewParity("[TZBlog](https://example.com)");
  }, 10000);
});

async function expectPreviewParity(markdown: string) {
  const expectedHtml = await renderMarkdown(markdown);

  render(<MarkdownEditorWithPreview value={markdown} onChange={vi.fn()} />);

  const article = screen.getByLabelText("Markdown 预览").querySelector("article");
  await waitFor(
    () => {
      expect(article?.innerHTML).toBe(expectedHtml);
    },
    { timeout: 5000 },
  );
}
