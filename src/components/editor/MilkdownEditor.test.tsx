import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MilkdownEditor } from "./MilkdownEditor";

describe("MilkdownEditor", () => {
  it("slashMenuAppearsAtCaret", () => {
    render(<MilkdownEditor value="" onChange={vi.fn()} />);

    const editor = screen.getByRole("textbox", { name: "Milkdown editor content" });
    fireEvent.change(editor, { target: { value: "/" } });

    expect(screen.getByRole("menu", { name: "Slash 菜单" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "二级标题" })).toBeInTheDocument();
  });

  it("bubbleMenuAppearsOnSelection", () => {
    render(<MilkdownEditor value="selected text" onChange={vi.fn()} />);

    const editor = screen.getByRole("textbox", { name: "Milkdown editor content" });
    fireEvent.select(editor, {
      target: {
        selectionStart: 0,
        selectionEnd: 8,
        value: "selected text",
      },
    });

    expect(screen.getByRole("toolbar", { name: "Bubble 菜单" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Bold" })).toBeInTheDocument();
  });
});
