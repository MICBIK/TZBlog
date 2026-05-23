import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
  renderMarkdown: vi.fn(),
}));

vi.mock("next/dynamic", () => ({
  default: mocks.dynamic,
}));

vi.mock("@/lib/markdown", () => ({
  renderMarkdown: mocks.renderMarkdown,
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.renderMarkdown.mockResolvedValue("<p>rendered</p>");
});

afterEach(() => {
  vi.useRealTimers();
});

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

  it("uses markdown-body preview wrapper without preview-only watermark", async () => {
    const { MarkdownEditorWithPreview } = await import("./MarkdownEditorWithPreview");

    render(<MarkdownEditorWithPreview value="## Preview" onChange={vi.fn()} />);

    const preview = screen.getByLabelText("Markdown preview");
    const article = preview.querySelector("article");
    expect(article).toHaveClass("markdown-body");
    expect(article).toHaveClass("max-w-none");
    expect(article?.className).not.toContain("prose");
    expect(
      screen.queryByText(/Lightweight in-browser preview|published page uses/i),
    ).not.toBeInTheDocument();
  });

  it("debounces preview rendering by 200ms and only renders the latest value", async () => {
    vi.useFakeTimers();
    const { MarkdownEditorWithPreview } = await import("./MarkdownEditorWithPreview");
    const { rerender } = render(
      <MarkdownEditorWithPreview value="a" onChange={vi.fn()} />,
    );

    rerender(<MarkdownEditorWithPreview value="ab" onChange={vi.fn()} />);
    rerender(<MarkdownEditorWithPreview value="abc" onChange={vi.fn()} />);

    await vi.advanceTimersByTimeAsync(199);
    expect(mocks.renderMarkdown).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(mocks.renderMarkdown).toHaveBeenCalledTimes(1);
    expect(mocks.renderMarkdown).toHaveBeenCalledWith("abc");
  });
});
