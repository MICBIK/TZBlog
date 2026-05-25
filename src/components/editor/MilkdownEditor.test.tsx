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
});
