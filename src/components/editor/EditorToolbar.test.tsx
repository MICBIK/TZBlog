import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EditorToolbar } from "./EditorToolbar";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("EditorToolbar source actions", () => {
  it("renders all required markdown source toolbar buttons", () => {
    const props = {
      source: null,
    } as unknown as React.ComponentProps<typeof EditorToolbar>;

    render(<EditorToolbar {...props} />);

    [
      /加粗.*⌘B/,
      /斜体.*⌘I/,
      /行内代码.*⌘E/,
      /二级标题.*H2.*⌘⌥2/,
      /三级标题.*H3.*⌘⌥3/,
      /无序列表.*⌘⇧8/,
      /有序列表.*⌘⇧7/,
      /引用/,
      /代码块/,
      /链接.*⌘K/,
      /图片/,
      /表格/,
      /提示块.*NOTE/,
    ].forEach((titlePattern) => {
      expect(screen.getByRole("button", { name: titlePattern })).toBeInTheDocument();
    });
  });

  it("opens a link dialog and wraps the selection after URL confirmation", async () => {
    const user = userEvent.setup();
    const wrapSelection = vi.fn();
    const props = {
      source: {
        getMarkdown: () => "click here",
        focus: vi.fn(),
        setSelection: vi.fn(),
        wrapSelection,
        prependToLine: vi.fn(),
        insertSnippet: vi.fn(),
      },
    } as unknown as React.ComponentProps<typeof EditorToolbar>;

    render(<EditorToolbar {...props} />);

    await user.click(screen.getByRole("button", { name: /链接.*⌘K/ }));

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toBeInTheDocument();

    await user.type(screen.getByLabelText(/URL/), "https://example.com");
    await user.click(screen.getByRole("button", { name: "插入链接" }));

    expect(wrapSelection).toHaveBeenCalledWith("[", "](https://example.com)");
  });

  it("opens a media dialog and inserts selected image markdown", async () => {
    const user = userEvent.setup();
    const insertSnippet = vi.fn();
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [
          {
            id: "media-1",
            filename: "hero.png",
            url: "/uploads/hero.png",
          },
        ],
      }),
    } as Response);
    const props = {
      source: {
        getMarkdown: () => "",
        focus: vi.fn(),
        setSelection: vi.fn(),
        wrapSelection: vi.fn(),
        prependToLine: vi.fn(),
        insertSnippet,
      },
    } as unknown as React.ComponentProps<typeof EditorToolbar>;

    render(<EditorToolbar {...props} />);

    await user.click(screen.getByRole("button", { name: "图片" }));

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    await user.click(await screen.findByRole("button", { name: /hero\.png/ }));

    expect(fetch).toHaveBeenCalledWith("/api/admin/media?pageSize=24");
    expect(insertSnippet).toHaveBeenCalledWith("![hero.png](/uploads/hero.png)");
  });
});
