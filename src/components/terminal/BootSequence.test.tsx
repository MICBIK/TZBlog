import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BootSequence } from "./BootSequence";

beforeEach(() => {
  vi.useFakeTimers();
  window.localStorage.clear();
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

afterEach(() => {
  vi.useRealTimers();
});

describe("BootSequence", () => {
  it("bootSequenceCompletesWithin1500msAndCanSkip", () => {
    render(<BootSequence channelSlug="stream" />);

    expect(screen.getByTestId("terminal-boot")).toBeInTheDocument();
    expect(screen.getAllByText(/\[ ok \]/).length).toBeGreaterThanOrEqual(1);

    fireEvent.click(screen.getByTestId("terminal-boot-skip"));

    expect(screen.queryByTestId("terminal-boot")).not.toBeInTheDocument();
    expect(window.localStorage.getItem("tzblog.terminal.boot.v1:stream")).toBe(
      "1",
    );

    window.localStorage.clear();
    render(<BootSequence channelSlug="stream-2" />);

    act(() => {
      vi.advanceTimersByTime(1250);
    });

    expect(screen.queryByTestId("terminal-boot")).not.toBeInTheDocument();
    expect(window.localStorage.getItem("tzblog.terminal.boot.v1:stream-2")).toBe(
      "1",
    );
  });
});
