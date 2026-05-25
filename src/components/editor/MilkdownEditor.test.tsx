import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MilkdownEditor } from "./MilkdownEditor";

const mocks = vi.hoisted(() => ({
  fetch: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("fetch", mocks.fetch);
  vi.stubGlobal("matchMedia", vi.fn().mockImplementation((query: string) => ({
    matches: query === "(prefers-reduced-motion: reduce)",
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })));
});

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

  it("imageDropTriggersMediaUpload", async () => {
    const onChange = vi.fn();
    mocks.fetch.mockResolvedValue(
      new Response(
        JSON.stringify({ data: { url: "/uploads/architecture.png", alt: "architecture.png" } }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    render(<MilkdownEditor value="" onChange={onChange} />);

    const editor = screen.getByRole("textbox", { name: "Milkdown editor content" });
    const file = new File(["binary"], "architecture.png", { type: "image/png" });

    fireEvent.drop(editor, {
      dataTransfer: {
        files: [file],
      },
    });

    await waitFor(() => {
      expect(mocks.fetch).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith("![architecture.png](/uploads/architecture.png)");
    });
  });

  it("modSTriggersOnSavePrevented", () => {
    const onSave = vi.fn();
    render(<MilkdownEditor value="" onChange={vi.fn()} onSave={onSave} />);

    const editor = screen.getByRole("textbox", { name: "Milkdown editor content" });
    const prevented = !fireEvent.keyDown(editor, {
      key: "s",
      code: "KeyS",
      metaKey: true,
    });

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(prevented).toBe(true);
  });

  it("debouncedOnChangeEmitsOnceAfter300ms", async () => {
    vi.useFakeTimers();
    const onChange = vi.fn();
    render(<MilkdownEditor value="" onChange={onChange} />);

    const editor = screen.getByRole("textbox", { name: "Milkdown editor content" });
    fireEvent.change(editor, { target: { value: "a" } });
    fireEvent.change(editor, { target: { value: "ab" } });
    fireEvent.change(editor, { target: { value: "abc" } });

    await vi.advanceTimersByTimeAsync(299);
    expect(onChange).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenLastCalledWith("abc");

    vi.useRealTimers();
  });

  it("reducedMotionDisablesAnimations", () => {
    render(<MilkdownEditor value="/" onChange={vi.fn()} />);

    const root = screen.getByRole("textbox", { name: "Milkdown editor content" }).closest(
      "[data-milkdown-editor]",
    );

    expect(root).toHaveAttribute("data-reduced-motion-safe");
    expect(screen.getByRole("menu", { name: "Slash 菜单" })).toHaveClass("transition-none");
  });
});
