import { render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MarkdownEditor } from "./MarkdownEditor";

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
});
