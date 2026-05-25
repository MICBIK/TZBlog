import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderMarkdown } from "@/lib/markdown";

import { TerminalEntryDetail } from "./TerminalEntryDetail";

describe("TerminalEntryDetail", () => {
  it("rendersVimLikeHeaderAndLineNumbers", () => {
    const sourceLines = ["line one", "line two", "line three"];

    render(
      <TerminalEntryDetail
        channelSlug="stream"
        entrySlug="note-2026-05-23"
        title="关于解决一类问题"
        html="<p>line one</p><p>line two</p>"
        sourceLines={sourceLines}
      />,
    );

    expect(screen.getByTestId("terminal-vim-header")).toHaveTextContent(
      "~/stream/note-2026-05-23.md",
    );

    const lineNumbers = screen.getByTestId("terminal-line-numbers");
    expect(lineNumbers).toHaveClass("hidden", "md:block");
    expect(lineNumbers).toHaveTextContent("1");
    expect(lineNumbers).toHaveTextContent("2");
    expect(lineNumbers).toHaveTextContent("3");
  });

  it("codeBlockShowsShikiAndPath", async () => {
    const markdown = '```ts title="src/foo.ts"\nconst x = 1;\n```';
    const html = await renderMarkdown(markdown);
    const sourceLines = markdown.split("\n");

    render(
      <TerminalEntryDetail
        channelSlug="stream"
        entrySlug="snippet"
        title="Snippet"
        html={html}
        sourceLines={sourceLines}
      />,
    );

    expect(screen.getByTestId("terminal-entry-body").innerHTML).toContain(
      "code-block-filename",
    );
    expect(screen.getByTestId("terminal-entry-body").innerHTML).toContain(
      "src/foo.ts",
    );
    expect(screen.getByTestId("terminal-entry-body").innerHTML).toMatch(
      /<span[^>]*style="[^"]*color:/,
    );
  });
});
