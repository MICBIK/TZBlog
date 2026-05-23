import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MarkdownEditor, type MarkdownEditorProps } from "./MarkdownEditor";

interface MarkdownSourceApi {
  getMarkdown: () => string;
  setSelection?: (from: number, to: number) => void;
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

  it("toolbar bold action wraps selection with **", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const sourceApiRef: { current: MarkdownSourceApi | null } = { current: null };

    render(
      <MarkdownEditor
        value="hello world"
        onChange={onChange}
        onReady={(api) => {
          sourceApiRef.current = api;
        }}
      />,
    );

    await waitFor(() => {
      expect(sourceApiRef.current).not.toBeNull();
    });

    sourceApiRef.current?.setSelection?.(6, 11);
    await user.click(screen.getByRole("button", { name: /加粗.*Bold.*⌘B/ }));

    expect(onChange).toHaveBeenCalledWith("hello **world**");
    expect(sourceApiRef.current?.getMarkdown()).toBe("hello **world**");
  });

  it("toolbar H2 action prepends ## to the current line", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const sourceApiRef: { current: MarkdownSourceApi | null } = { current: null };

    render(
      <MarkdownEditor
        value="hello"
        onChange={onChange}
        onReady={(api) => {
          sourceApiRef.current = api;
        }}
      />,
    );

    await waitFor(() => {
      expect(sourceApiRef.current).not.toBeNull();
    });

    sourceApiRef.current?.setSelection?.(2, 2);
    await user.click(screen.getByRole("button", { name: /二级标题.*H2.*⌘⌥2/ }));

    expect(onChange).toHaveBeenCalledWith("## hello");
    expect(sourceApiRef.current?.getMarkdown()).toBe("## hello");
  });

  it("toolbar code block action inserts a fenced code block", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const sourceApiRef: { current: MarkdownSourceApi | null } = { current: null };

    render(
      <MarkdownEditor
        value=""
        onChange={onChange}
        onReady={(api) => {
          sourceApiRef.current = api;
        }}
      />,
    );

    await waitFor(() => {
      expect(sourceApiRef.current).not.toBeNull();
    });

    sourceApiRef.current?.setSelection?.(0, 0);
    await user.click(screen.getByRole("button", { name: /代码块.*Code Block/ }));

    expect(onChange).toHaveBeenCalledWith("```\n\n```");
    expect(sourceApiRef.current?.getMarkdown()).toBe("```\n\n```");
  });

  it("toolbar callout action inserts a NOTE alert block", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const sourceApiRef: { current: MarkdownSourceApi | null } = { current: null };

    render(
      <MarkdownEditor
        value=""
        onChange={onChange}
        onReady={(api) => {
          sourceApiRef.current = api;
        }}
      />,
    );

    await waitFor(() => {
      expect(sourceApiRef.current).not.toBeNull();
    });

    sourceApiRef.current?.setSelection?.(0, 0);
    await user.click(screen.getByRole("button", { name: /提示块.*Callout.*NOTE/ }));

    expect(onChange).toHaveBeenCalledWith("> [!NOTE]\n> 内容");
    expect(sourceApiRef.current?.getMarkdown()).toBe("> [!NOTE]\n> 内容");
  });

  it("tab inserts 2 spaces at the cursor", async () => {
    const onChange = vi.fn();
    const sourceApiRef: { current: MarkdownSourceApi | null } = { current: null };
    const { container } = render(
      <MarkdownEditor
        value=""
        onChange={onChange}
        onReady={(api) => {
          sourceApiRef.current = api;
        }}
      />,
    );

    await waitFor(() => {
      expect(sourceApiRef.current).not.toBeNull();
    });

    sourceApiRef.current?.setSelection?.(0, 0);
    fireEvent.keyDown(container.querySelector(".cm-content") as HTMLElement, {
      key: "Tab",
      code: "Tab",
    });

    expect(onChange).toHaveBeenCalledWith("  ");
  });

  it("continues unordered list markup on Enter", async () => {
    const onChange = vi.fn();
    const sourceApiRef: { current: MarkdownSourceApi | null } = { current: null };
    const { container } = render(
      <MarkdownEditor
        value="- item 1"
        onChange={onChange}
        onReady={(api) => {
          sourceApiRef.current = api;
        }}
      />,
    );

    await waitFor(() => {
      expect(sourceApiRef.current).not.toBeNull();
    });

    sourceApiRef.current?.setSelection?.(8, 8);
    fireEvent.keyDown(container.querySelector(".cm-content") as HTMLElement, {
      key: "Enter",
      code: "Enter",
    });

    expect(onChange).toHaveBeenCalledWith("- item 1\n- ");
  });

  it("renders line numbers and placeholder", async () => {
    const { container } = render(
      <MarkdownEditor
        value=""
        onChange={vi.fn()}
        placeholder="在这里写 Markdown..."
      />,
    );

    await waitFor(() => {
      expect(container.querySelector(".cm-lineNumbers")).toBeInTheDocument();
    });

    expect(container.querySelector(".cm-placeholder")).toHaveTextContent(
      "在这里写 Markdown...",
    );
  });

  it("mod+s triggers onSave without browser default", async () => {
    const onSave = vi.fn();
    const props = {
      value: "",
      onChange: vi.fn(),
      onSave,
    } as MarkdownEditorProps & { onSave: () => void };
    const { container } = render(<MarkdownEditor {...props} />);

    await waitFor(() => {
      expect(container.querySelector(".cm-content")).toBeInTheDocument();
    });

    const prevented = !fireEvent.keyDown(container.querySelector(".cm-content") as HTMLElement, {
      key: "s",
      code: "KeyS",
      metaKey: true,
    });

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(prevented).toBe(true);
  });

  it("auto-pairs square brackets", async () => {
    const onChange = vi.fn();
    const sourceApiRef: { current: MarkdownSourceApi | null } = { current: null };
    const { container } = render(
      <MarkdownEditor
        value=""
        onChange={onChange}
        onReady={(api) => {
          sourceApiRef.current = api;
        }}
      />,
    );

    await waitFor(() => {
      expect(sourceApiRef.current).not.toBeNull();
    });

    sourceApiRef.current?.setSelection?.(0, 0);
    fireEvent.keyDown(container.querySelector(".cm-content") as HTMLElement, {
      key: "[",
      code: "BracketLeft",
    });

    expect(onChange).toHaveBeenCalledWith("[]");
  });
});
