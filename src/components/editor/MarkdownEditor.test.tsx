import { render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MarkdownEditor, type MarkdownEditorProps } from "./MarkdownEditor";

interface MarkdownSourceApi {
  getMarkdown: () => string;
}

describe("MarkdownEditor source contract", () => {
  it("displays raw markdown text in editor surface", async () => {
    const { container } = render(
      <MarkdownEditor
        value={"# Heading\n\n- item\n\n```ts\nconst x = 1;\n```"}
        onChange={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(container.querySelector(".cm-content")).toBeInTheDocument();
    });

    const source = container.querySelector(".cm-content");
    expect(source?.textContent).toContain("# Heading");
    expect(source?.textContent).toContain("```ts");
    expect(source?.textContent).toContain("- item");
  });

  it("does not apply prose or markdown-body classes to editor surface", async () => {
    const { container } = render(
      <MarkdownEditor value={"### Raw heading"} onChange={vi.fn()} />,
    );

    await waitFor(() => {
      expect(container.querySelector(".cm-content")).toBeInTheDocument();
    });

    expect(container.querySelector(".prose")).not.toBeInTheDocument();
    expect(container.querySelector(".markdown-body")).not.toBeInTheDocument();
  });

  it("loads complex markdown literally and exposes it unchanged", async () => {
    const source = [
      "## 标题",
      "",
      "正文段 1。",
      "",
      "- item 1",
      "- item 2",
      "",
      "> [!WARNING]",
      "> 警告内容",
      "",
      "```ts",
      "const x = 1;",
      "```",
      "",
      "普通段。",
    ].join("\n");
    const onReady = vi.fn<(api: MarkdownSourceApi) => void>();
    const props = {
      value: source,
      onChange: vi.fn(),
      onReady,
    } as MarkdownEditorProps & { onReady: (api: MarkdownSourceApi) => void };

    const { container } = render(<MarkdownEditor {...props} />);

    await waitFor(() => {
      expect(container.querySelector(".cm-content")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(onReady).toHaveBeenCalled();
    });

    expect(onReady.mock.calls[0]?.[0].getMarkdown()).toBe(source);
  });
});
