import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { NotionMarkdownEditor } from "./NotionMarkdownEditor";

describe("NotionMarkdownEditor slash commands", () => {
  it("slashMenuInsertsSupportedBlocks", async () => {
    const user = userEvent.setup();
    const cases = [
      { label: "Paragraph", expected: "段落" },
      { label: "Heading 2", expected: "## 标题" },
      { label: "Bullet List", expected: "- 列表项" },
      { label: "Numbered List", expected: "1. 列表项" },
      { label: "Quote", expected: "> 引用" },
      { label: "Code Block", expected: "```\n代码\n```" },
      { label: "Image", expected: "![alt](url)" },
      {
        label: "Table",
        expected: "| 列 | 值 |\n| --- | --- |\n| 示例 | 内容 |",
      },
      { label: "Callout", expected: "> [!NOTE]\n> 内容" },
    ];

    for (const item of cases) {
      const onChange = vi.fn();
      const { unmount } = render(
        <NotionMarkdownEditor value="" onChange={onChange} />,
      );

      const editor = screen.getByRole("textbox", { name: "文章内容" });
      await user.click(editor);
      await user.keyboard("/");

      const menu = screen.getByRole("menu", { name: "Block commands" });
      await user.click(within(menu).getByRole("menuitem", { name: item.label }));

      expect(onChange).toHaveBeenLastCalledWith(item.expected);
      expect(editor).toHaveFocus();
      unmount();
    }
  });
});

describe("NotionMarkdownEditor bubble formatting", () => {
  it("bubbleMenuFormatsSelectionAsMarkdown", async () => {
    const user = userEvent.setup();
    const cases = [
      { label: "Bold", initial: "hello", expected: "**hello**" },
      { label: "Italic", initial: "hello", expected: "*hello*" },
      { label: "Inline Code", initial: "hello", expected: "`hello`" },
      { label: "Link", initial: "hello", expected: "[hello](url)" },
      { label: "Heading 2", initial: "hello", expected: "## hello" },
    ];

    for (const item of cases) {
      const onChange = vi.fn();
      const { unmount } = render(
        <NotionMarkdownEditor value={item.initial} onChange={onChange} />,
      );

      const editor = screen.getByRole("textbox", {
        name: "文章内容",
      }) as HTMLTextAreaElement;
      editor.setSelectionRange(0, item.initial.length);
      fireEvent.select(editor);

      const toolbar = screen.getByRole("toolbar", { name: "Text formatting" });
      await user.click(within(toolbar).getByRole("button", { name: item.label }));

      expect(onChange).toHaveBeenLastCalledWith(item.expected);
      expect(editor).toHaveFocus();
      unmount();
    }
  });
});
