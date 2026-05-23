import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
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
});
