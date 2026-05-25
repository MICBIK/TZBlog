import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  notFound: vi.fn(),
}));

vi.mock("@/components/editor/MilkdownEditor", () => ({
  MilkdownEditor: ({ value }: { value: string }) => (
    <div data-testid="editor-demo-surface" data-value={value} />
  ),
}));

vi.mock("next/navigation", () => ({
  notFound: mocks.notFound,
}));

describe("EditorDemoPage", () => {
  it("editorDemoRouteReturnsNotFound", async () => {
    const { default: EditorDemoPage } = await import("./page");

    render(<EditorDemoPage />);

    expect(mocks.notFound).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("editor-demo-surface")).not.toBeInTheDocument();
    expect(document.body).not.toHaveTextContent(/Tiptap|WYSIWYG/i);
    expect(
      screen.queryByRole("button", { name: /save|publish|保存|发布/i }),
    ).not.toBeInTheDocument();
  });
});
