import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock("next/dynamic", () => ({
  default: mocks.dynamic,
}));

vi.mock("@/lib/markdown", () => ({
  renderMarkdown: mocks.renderMarkdown,
}));

vi.mock("sonner", () => ({
  toast: {
    error: mocks.toastError,
    success: mocks.toastSuccess,
  },
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

    const preview = screen.getByLabelText("Markdown 预览");
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

  it("does not let stale preview renders overwrite the latest html", async () => {
    vi.useFakeTimers();
    let resolveOld: ((html: string) => void) | null = null;
    let resolveNew: ((html: string) => void) | null = null;
    mocks.renderMarkdown.mockImplementation(
      (value: string) =>
        new Promise<string>((resolve) => {
          if (value === "old") resolveOld = resolve;
          if (value === "new") resolveNew = resolve;
        }),
    );
    const { MarkdownEditorWithPreview } = await import("./MarkdownEditorWithPreview");
    const { rerender } = render(
      <MarkdownEditorWithPreview value="old" onChange={vi.fn()} />,
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
    });
    expect(mocks.renderMarkdown).toHaveBeenCalledWith("old");

    rerender(<MarkdownEditorWithPreview value="new" onChange={vi.fn()} />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
    });
    expect(mocks.renderMarkdown).toHaveBeenCalledWith("new");

    await act(async () => {
      resolveNew?.("<p>new</p>");
      await Promise.resolve();
    });
    expect(screen.getByLabelText("Markdown 预览").querySelector("article")?.innerHTML).toBe(
      "<p>new</p>",
    );

    await act(async () => {
      resolveOld?.("<p>old</p>");
      await Promise.resolve();
    });
    expect(screen.getByLabelText("Markdown 预览").querySelector("article")?.innerHTML).toBe(
      "<p>new</p>",
    );
  });

  it("shows an error banner and keeps the last successful preview on render failure", async () => {
    vi.useFakeTimers();
    mocks.renderMarkdown
      .mockResolvedValueOnce("<p>last good</p>")
      .mockRejectedValueOnce(new Error("broken markdown"));
    const { MarkdownEditorWithPreview } = await import("./MarkdownEditorWithPreview");
    const { rerender } = render(
      <MarkdownEditorWithPreview value="good" onChange={vi.fn()} />,
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
    });
    expect(screen.getByLabelText("Markdown 预览").querySelector("article")?.innerHTML).toBe(
      "<p>last good</p>",
    );

    rerender(<MarkdownEditorWithPreview value="bad" onChange={vi.fn()} />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
    });

    expect(screen.getByRole("alert")).toHaveTextContent("broken markdown");
    expect(screen.getByLabelText("Markdown 预览").querySelector("article")?.innerHTML).toBe(
      "<p>last good</p>",
    );
  });

  it("binds copy buttons inside the live preview", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    mocks.renderMarkdown.mockResolvedValue(
      [
        '<figure class="code-block" data-language="ts">',
        '<figcaption class="code-block-chrome">',
        '<button class="code-block-copy" data-copy data-state="idle" aria-label="复制代码" type="button"></button>',
        "</figcaption>",
        "<pre><code>const answer = 42;</code></pre>",
        "</figure>",
      ].join(""),
    );
    const { MarkdownEditorWithPreview } = await import("./MarkdownEditorWithPreview");

    render(<MarkdownEditorWithPreview value="```ts\nconst answer = 42;\n```" onChange={vi.fn()} />);

    await screen.findByRole("button", { name: "复制代码" });
    await user.click(screen.getByRole("button", { name: "复制代码" }));

    expect(writeText).toHaveBeenCalledWith("const answer = 42;");
    expect(mocks.toastSuccess).toHaveBeenCalledWith("代码已复制");
  });
});
