import { fireEvent, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { ComponentType } from "react"
import { describe, expect, it, vi } from "vitest"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"

import { EditorToolbar } from "./EditorToolbar"
import { NotionMarkdownEditor } from "./NotionMarkdownEditor"

vi.mock("next/dynamic", () => ({
  default: (
    loader: () => Promise<ComponentType<{ value: string }>>,
    options: { ssr?: boolean },
  ) => {
    void loader
    void options

    return function DynamicMarkdownEditor({ value }: { value: string }) {
      return <div data-testid="dynamic-markdown-editor">{value}</div>
    }
  },
}))

vi.mock("@/lib/markdown", () => ({
  renderMarkdown: vi.fn().mockResolvedValue("<p>预览</p>"),
}))

describe("editor chrome locale", () => {
  it("rendersChineseEditorChrome", async () => {
    const user = userEvent.setup()
    const { MarkdownEditorWithPreview } = await import(
      "./MarkdownEditorWithPreview"
    )

    const previewRender = render(
      <MarkdownEditorWithPreview value="# 标题" onChange={vi.fn()} />,
    )

    expect(
      screen.getByRole("tablist", { name: "编辑视图" }),
    ).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "编辑" })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "预览" })).toBeInTheDocument()
    expect(screen.getByLabelText("Markdown 预览")).toBeInTheDocument()
    expect(screen.queryByLabelText("Editor view")).not.toBeInTheDocument()
    expect(screen.queryByLabelText("Markdown preview")).not.toBeInTheDocument()
    previewRender.unmount()

    const commandRender = render(
      <NotionMarkdownEditor value="" onChange={vi.fn()} />,
    )

    const notionEditor = screen.getByRole("textbox", { name: "文章内容" })
    await user.click(notionEditor)
    await user.keyboard("/")

    const commandMenu = screen.getByRole("menu", { name: "块命令" })
    expect(
      within(commandMenu).getByRole("menuitem", { name: "段落" }),
    ).toBeInTheDocument()
    expect(
      within(commandMenu).getByRole("menuitem", { name: "二级标题" }),
    ).toBeInTheDocument()
    expect(
      within(commandMenu).getByRole("menuitem", { name: "代码块" }),
    ).toBeInTheDocument()
    expect(
      within(commandMenu).queryByRole("menuitem", { name: "Paragraph" }),
    ).not.toBeInTheDocument()
    expect(screen.queryByRole("menu", { name: "Block commands" })).not.toBeInTheDocument()
    commandRender.unmount()

    const toolbarRender = render(
      <NotionMarkdownEditor value="hello" onChange={vi.fn()} />,
    )
    const selectedEditor = screen.getByRole("textbox", { name: "文章内容" })
    ;(selectedEditor as HTMLTextAreaElement).setSelectionRange(0, 5)
    fireEvent.select(selectedEditor)

    const formatToolbar = screen.getByRole("toolbar", { name: "文字格式" })
    expect(
      within(formatToolbar).getByRole("button", { name: "加粗" }),
    ).toBeInTheDocument()
    expect(
      within(formatToolbar).getByRole("button", { name: "行内代码" }),
    ).toBeInTheDocument()
    expect(
      within(formatToolbar).queryByRole("button", { name: "Bold" }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("toolbar", { name: "Text formatting" }),
    ).not.toBeInTheDocument()
    toolbarRender.unmount()

    const sourceToolbarRender = render(<EditorToolbar source={null} />)

    expect(
      screen.getByRole("toolbar", { name: "Markdown 源码工具栏" }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /加粗.*⌘B/ }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /提示块.*NOTE/ }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("toolbar", { name: "Markdown source toolbar" }),
    ).not.toBeInTheDocument()
    sourceToolbarRender.unmount()

    render(
      <Dialog open>
        <DialogContent>
          <DialogTitle>弹窗标题</DialogTitle>
        </DialogContent>
      </Dialog>,
    )

    expect(screen.getByRole("button", { name: "关闭" })).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "Close" }),
    ).not.toBeInTheDocument()
  })
})
