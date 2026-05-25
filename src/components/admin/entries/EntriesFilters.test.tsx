import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { EntriesFilters, type EntriesFilter } from "./EntriesFilters";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }),
}));

vi.mock("@/components/ui/select", async () => {
  const React = await import("react");
  const SelectContext = React.createContext<{
    onValueChange: (value: string) => void;
  } | null>(null);

  return {
    Select: ({
      value,
      onValueChange,
      children,
    }: {
      value: string;
      onValueChange: (value: string) => void;
      children: React.ReactNode;
    }) => (
      <SelectContext.Provider value={{ onValueChange }}>
        <div data-value={value}>{children}</div>
      </SelectContext.Provider>
    ),
    SelectContent: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
    SelectItem: ({
      value,
      children,
    }: {
      value: string;
      children: React.ReactNode;
    }) => {
      const ctx = React.useContext(SelectContext);
      return (
        <button type="button" onClick={() => ctx?.onValueChange(value)}>
          {children}
        </button>
      );
    },
    SelectTrigger: ({
      children,
      ...props
    }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
      <button type="button" {...props}>
        {children}
      </button>
    ),
    SelectValue: ({ placeholder }: { placeholder?: string }) => (
      <span>{placeholder}</span>
    ),
  };
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
});

describe("EntriesFilters", () => {
  it("pushes the q filter after a 300ms debounce", async () => {
    vi.useFakeTimers();
    renderFilters({ currentFilter: { page: 4, pageSize: 20 } });

    fireEvent.change(screen.getByPlaceholderText("搜索标题…"), {
      target: { value: "vitest" },
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(299);
    });
    expect(mocks.push).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(mocks.push).toHaveBeenCalledWith("/admin/entries?q=vitest");
    expect(mocks.refresh).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it("pushes status=PUBLISHED when the status select changes", async () => {
    const user = userEvent.setup();
    renderFilters({ currentFilter: { page: 3, pageSize: 20 } });

    await user.click(screen.getByRole("button", { name: "已发布" }));

    expect(mocks.push).toHaveBeenCalledWith(
      "/admin/entries?status=PUBLISHED",
    );
  });

  it("resets stale page params whenever a filter changes", async () => {
    const user = userEvent.setup();
    renderFilters({ currentFilter: { page: 5, pageSize: 20 } });

    await user.click(screen.getByRole("button", { name: "草稿" }));

    expect(mocks.push).toHaveBeenCalledWith("/admin/entries?status=DRAFT");
    expect(mocks.push.mock.calls[0][0]).not.toContain("page=5");
  });

  it("clears all filters with the reset button", async () => {
    const user = userEvent.setup();
    renderFilters({
      currentFilter: {
        page: 2,
        pageSize: 20,
        q: "vitest",
        status: "PUBLISHED",
        channelId: "col-1",
        tag: "react",
      },
    });

    await user.click(screen.getByRole("button", { name: "重置" }));

    expect(mocks.push).toHaveBeenCalledWith("/admin/entries");
    expect(mocks.refresh).toHaveBeenCalledTimes(1);
  });

  it("only shows the reset button when a filter is active", () => {
    const { rerender } = renderFilters({
      currentFilter: { page: 1, pageSize: 20 },
    });

    expect(screen.queryByRole("button", { name: "重置" })).not.toBeInTheDocument();

    rerender(
      <EntriesFilters
        currentFilter={{ page: 1, pageSize: 20, q: "vitest" }}
        columns={columns}
        tags={tags}
      />,
    );

    expect(screen.getByRole("button", { name: "重置" })).toBeInTheDocument();
  });

  it("removes status, column, and tag params when switching to all options", async () => {
    const user = userEvent.setup();

    const { rerender } = renderFilters({
      currentFilter: {
        page: 3,
        pageSize: 20,
        status: "PUBLISHED",
        channelId: "col-1",
        tag: "react",
      },
    });
    await user.click(screen.getByRole("button", { name: "全部状态" }));
    expect(mocks.push).toHaveBeenLastCalledWith(
      "/admin/entries?channelId=col-1&tag=react",
    );

    rerender(
      <EntriesFilters
        currentFilter={{
          page: 3,
          pageSize: 20,
          status: "PUBLISHED",
          channelId: "col-1",
          tag: "react",
        }}
        columns={columns}
        tags={tags}
      />,
    );
    await user.click(screen.getByRole("button", { name: "全部频道" }));
    expect(mocks.push).toHaveBeenLastCalledWith(
      "/admin/entries?status=PUBLISHED&tag=react",
    );

    rerender(
      <EntriesFilters
        currentFilter={{
          page: 3,
          pageSize: 20,
          status: "PUBLISHED",
          channelId: "col-1",
          tag: "react",
        }}
        columns={columns}
        tags={tags}
      />,
    );
    await user.click(screen.getByRole("button", { name: "全部标签" }));
    expect(mocks.push).toHaveBeenLastCalledWith(
      "/admin/entries?status=PUBLISHED&channelId=col-1",
    );
  });
});

const columns = [{ id: "col-1", name: "技术" }];
const tags = [{ slug: "react", name: "React" }];

function renderFilters({
  currentFilter = { page: 1, pageSize: 20 },
}: {
  currentFilter?: EntriesFilter;
} = {}) {
  return render(
    <EntriesFilters currentFilter={currentFilter} columns={columns} tags={tags} />,
  );
}
