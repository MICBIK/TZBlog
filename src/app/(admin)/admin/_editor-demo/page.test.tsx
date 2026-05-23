import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/editor/MarkdownEditorWithPreview", () => ({
  MarkdownEditorWithPreview: ({ value }: { value: string }) => (
    <div data-testid="editor-demo-surface" data-value={value} />
  ),
}));

describe("EditorDemoPage", () => {
  it("identifies the route as a non-production editor sandbox", async () => {
    const { default: EditorDemoPage } = await import("./page");

    render(<EditorDemoPage />);

    expect(
      screen.getByText("Editor PoC sandbox — not part of production"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("editor-demo-surface")).toBeInTheDocument();
  });

  it("uses current Markdown source-editor sample copy and does not expose DB actions", async () => {
    const { default: EditorDemoPage } = await import("./page");

    render(<EditorDemoPage />);

    const editor = screen.getByTestId("editor-demo-surface");
    expect(editor.getAttribute("data-value")).toContain(
      "Stored and edited as literal Markdown source",
    );
    expect(document.body).not.toHaveTextContent(/Tiptap|WYSIWYG/i);
    expect(
      screen.queryByRole("button", { name: /save|publish|保存|发布/i }),
    ).not.toBeInTheDocument();
  });
});
