import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ComponentType } from "react";

const mocks = vi.hoisted(() => ({
  dynamic: vi.fn(
    (
      loader: () => Promise<ComponentType<{ value: string; onChange: (value: string) => void }>>,
      options: { ssr?: boolean },
    ) => {
      void loader;
      void options;

      return function DynamicMarkdownEditor({
        value,
      }: {
        value: string;
        onChange: (value: string) => void;
      }) {
        return <div data-testid="dynamic-markdown-editor">{value}</div>;
      };
    },
  ),
}));

vi.mock("next/dynamic", () => ({
  default: mocks.dynamic,
}));

describe("MarkdownEditorWithPreview SSR safety", () => {
  it("loads MarkdownEditor through next/dynamic with ssr disabled", async () => {
    const { MarkdownEditorWithPreview } = await import("./MarkdownEditorWithPreview");

    render(<MarkdownEditorWithPreview value="# hi" onChange={vi.fn()} />);

    expect(mocks.dynamic).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({ ssr: false }),
    );
    expect(screen.getByTestId("dynamic-markdown-editor")).toHaveTextContent("# hi");
  });
});
