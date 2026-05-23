import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentType } from "react";

describe("MarkdownCopyButtons", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("binds clipboard write on copy button click", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    const { MarkdownCopyButtons } = await loadMarkdownCopyButtons();

    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    render(
      <article className="markdown-body">
        <figure className="code-block" data-language="ts">
          <figcaption className="code-block-chrome">
            <button
              className="code-block-copy"
              data-copy
              data-state="idle"
              aria-label="复制代码"
              type="button"
            >
              <svg aria-hidden="true" className="code-block-copy-icon" />
            </button>
          </figcaption>
          <pre>
            <code>const x = 1;</code>
          </pre>
        </figure>
        <MarkdownCopyButtons />
      </article>,
    );

    await user.click(screen.getByRole("button", { name: "复制代码" }));

    expect(writeText).toHaveBeenCalledWith("const x = 1;");
  });
});

async function loadMarkdownCopyButtons(): Promise<{
  MarkdownCopyButtons: ComponentType;
}> {
  const modulePath = "./MarkdownCopyButtons";
  return (await import(modulePath)) as {
    MarkdownCopyButtons: ComponentType;
  };
}
