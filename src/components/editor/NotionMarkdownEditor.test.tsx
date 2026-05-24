import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { NotionMarkdownEditor } from "./NotionMarkdownEditor";

describe("NotionMarkdownEditor slash commands", () => {
  it("slashMenuInsertsSupportedBlocks", async () => {
    const user = userEvent.setup();
    const cases = [
      { label: "段落", expected: "段落" },
      { label: "二级标题", expected: "## 标题" },
      { label: "无序列表", expected: "- 列表项" },
      { label: "有序列表", expected: "1. 列表项" },
      { label: "引用", expected: "> 引用" },
      { label: "代码块", expected: "```\n代码\n```" },
      { label: "图片", expected: "![图片描述](url)" },
      {
        label: "表格",
        expected: "| 列 | 值 |\n| --- | --- |\n| 示例 | 内容 |",
      },
      { label: "提示块", expected: "> [!NOTE]\n> 内容" },
    ];

    for (const item of cases) {
      const onChange = vi.fn();
      const { unmount } = render(
        <NotionMarkdownEditor value="" onChange={onChange} />,
      );

      const editor = screen.getByRole("textbox", { name: "文章内容" });
      await user.click(editor);
      await user.keyboard("/");

      const menu = screen.getByRole("menu", { name: "块命令" });
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
      { label: "加粗", initial: "hello", expected: "**hello**" },
      { label: "斜体", initial: "hello", expected: "*hello*" },
      { label: "行内代码", initial: "hello", expected: "`hello`" },
      { label: "链接", initial: "hello", expected: "[hello](url)" },
      { label: "二级标题", initial: "hello", expected: "## hello" },
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

      const toolbar = screen.getByRole("toolbar", { name: "文字格式" });
      await user.click(within(toolbar).getByRole("button", { name: item.label }));

      expect(onChange).toHaveBeenLastCalledWith(item.expected);
      expect(editor).toHaveFocus();
      unmount();
    }
  });
});

describe("NotionMarkdownEditor media insertion", () => {
  it("imageCommandUsesMediaLibraryUrl", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <NotionMarkdownEditor
        value=""
        onChange={onChange}
        mediaItems={[
          {
            id: "media-1",
            alt: "架构图",
            url: "/uploads/architecture.png",
          },
        ]}
      />,
    );

    const editor = screen.getByRole("textbox", { name: "文章内容" });
    await user.click(editor);
    await user.keyboard("/");

    const menu = screen.getByRole("menu", { name: "块命令" });
    await user.click(within(menu).getByRole("menuitem", { name: "图片" }));

    const dialog = screen.getByRole("dialog", { name: "选择媒体" });
    await user.click(within(dialog).getByRole("button", { name: "架构图" }));

    expect(onChange).toHaveBeenLastCalledWith("![架构图](/uploads/architecture.png)");
    expect(onChange).not.toHaveBeenCalledWith(expect.stringContaining("blob:"));
    expect(onChange).not.toHaveBeenCalledWith(expect.stringContaining("data:"));
    expect(editor).toHaveFocus();
  });
});
