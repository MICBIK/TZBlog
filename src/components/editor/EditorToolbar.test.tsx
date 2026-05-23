import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EditorToolbar } from "./EditorToolbar";

describe("EditorToolbar source actions", () => {
  it("renders all required markdown source toolbar buttons", () => {
    const props = {
      source: null,
    } as unknown as React.ComponentProps<typeof EditorToolbar>;

    render(<EditorToolbar {...props} />);

    [
      /加粗.*Bold.*⌘B/,
      /斜体.*Italic.*⌘I/,
      /行内代码.*Code.*⌘E/,
      /二级标题.*H2.*⌘⌥2/,
      /三级标题.*H3.*⌘⌥3/,
      /无序列表.*UL.*⌘⇧8/,
      /有序列表.*OL.*⌘⇧7/,
      /引用.*Quote/,
      /代码块.*Code Block/,
      /链接.*Link.*⌘K/,
      /图片.*Image/,
      /表格.*Table/,
      /提示块.*Callout.*NOTE/,
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

    await user.click(screen.getByRole("button", { name: /链接.*Link.*⌘K/ }));

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toBeInTheDocument();

    await user.type(screen.getByLabelText(/URL/), "https://example.com");
    await user.click(screen.getByRole("button", { name: /插入链接|Insert link/ }));

    expect(wrapSelection).toHaveBeenCalledWith("[", "](https://example.com)");
  });
});
