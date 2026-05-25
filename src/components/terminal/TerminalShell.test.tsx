import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { BootSequence } from "./BootSequence";
import { TerminalShell } from "./TerminalShell";

beforeEach(() => {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );
});

describe("TerminalShell", () => {
  it("rendersTerminalThemeWithMonoFont", () => {
    render(
      <TerminalShell slug="stream">
        <p>content</p>
      </TerminalShell>,
    );

    const shell = screen.getByTestId("terminal-shell");
    expect(shell).toHaveAttribute("data-theme", "terminal");
    expect(shell).toHaveClass("bg-bg", "text-fg");
    expect(shell.style.fontFamily).toContain("--font-jetbrains-mono");
  });

  it("rendersPromptWithBlinkingCursor", () => {
    render(
      <TerminalShell slug="stream">
        <p>content</p>
      </TerminalShell>,
    );

    expect(screen.getByTestId("terminal-prompt")).toHaveTextContent(
      "hai@tzblog:",
    );
    expect(screen.getByTestId("terminal-prompt")).toHaveTextContent("~/stream$");

    const cursor = screen.getByTestId("terminal-cursor");
    expect(cursor).toHaveClass("terminal-cursor");
    expect(cursor).not.toHaveAttribute("data-static", "true");
  });

  it("linkHoverShowsArrowPrefix", () => {
    render(
      <TerminalShell slug="stream">
        <span className="terminal-link">entry</span>
      </TerminalShell>,
    );

    expect(screen.getByText("entry")).toHaveClass("terminal-link");
  });

  it("reducedMotionStopsCursorBlinkAndBoot", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockImplementation((query: string) => ({
        matches: query === "(prefers-reduced-motion: reduce)",
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    );

    window.localStorage.clear();

    render(
      <>
        <TerminalShell slug="stream">
          <p>content</p>
        </TerminalShell>
        <BootSequence channelSlug="stream" />
      </>,
    );

    expect(screen.getByTestId("terminal-cursor")).toHaveAttribute(
      "data-static",
      "true",
    );
    expect(screen.queryByTestId("terminal-boot")).not.toBeInTheDocument();
  });
});
