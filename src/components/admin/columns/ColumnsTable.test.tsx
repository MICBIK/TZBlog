import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ColumnsTable, type ColumnRow } from "./ColumnsTable";

const mocks = vi.hoisted(() => ({
  fetch: vi.fn(),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    error: mocks.toastError,
    success: mocks.toastSuccess,
  },
}));

vi.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
  DropdownMenuItem: ({
    asChild,
    children,
    onSelect,
  }: {
    asChild?: boolean;
    children: ReactNode;
    onSelect?: (event: { preventDefault: () => void }) => void;
  }) =>
    asChild ? (
      <>{children}</>
    ) : (
      <button type="button" onClick={() => onSelect?.({ preventDefault: vi.fn() })}>
        {children}
      </button>
    ),
  DropdownMenuSeparator: () => <hr />,
  DropdownMenuTrigger: ({ children }: { children: ReactNode }) => (
    <>{children}</>
  ),
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("fetch", mocks.fetch);
  mocks.fetch.mockResolvedValue(okResponse());
});

describe("ColumnsTable", () => {
  it("inline delete: click 删除 opens AlertDialog without firing DELETE", async () => {
    const user = userEvent.setup();
    renderTable({
      columns: [
        column({ id: "delete-me", slug: "delete-me", name: "删掉专栏" }),
      ],
    });

    await user.click(screen.getByRole("button", { name: "操作 delete-me" }));
    await user.click(screen.getByRole("button", { name: "删除" }));

    const dialog = screen.getByRole("alertdialog");
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText("确认删除专栏")).toBeInTheDocument();
    expect(within(dialog).getByText(/删掉专栏/)).toBeInTheDocument();
    expect(within(dialog).getByText(/翻译/)).toBeInTheDocument();
    expect(within(dialog).getByText(/文章/)).toBeInTheDocument();
    expect(within(dialog).getByText(/迁移文章/)).toBeInTheDocument();
    expect(within(dialog).getByText(/不可恢复/)).toBeInTheDocument();
    expect(mocks.fetch).not.toHaveBeenCalled();
    expect(screen.getByText("删掉专栏")).toBeInTheDocument();
  });

  it("inline delete: AlertDialog 取消 → no DELETE + row stays", async () => {
    const user = userEvent.setup();
    renderTable({
      columns: [
        column({ id: "cancel-delete", slug: "cancel-delete", name: "取消删除" }),
      ],
    });

    await user.click(screen.getByRole("button", { name: "操作 cancel-delete" }));
    await user.click(screen.getByRole("button", { name: "删除" }));
    await user.click(screen.getByRole("button", { name: /^取消$/ }));

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(mocks.fetch).not.toHaveBeenCalled();
    expect(screen.getByText("取消删除")).toBeInTheDocument();
  });

  it("inline delete: AlertDialog 确认删除 → DELETE + row removal + toast.success", async () => {
    const user = userEvent.setup();
    renderTable({
      columns: [
        column({ id: "delete-me", slug: "delete-me", name: "删掉专栏" }),
        column({ id: "keep-me", slug: "keep-me", name: "保留专栏", order: 2 }),
      ],
    });

    await user.click(screen.getByRole("button", { name: "操作 delete-me" }));
    await user.click(screen.getAllByRole("button", { name: "删除" })[0]);
    await user.click(screen.getByRole("button", { name: /^确认删除$/ }));

    await waitFor(() => {
      expect(mocks.fetch).toHaveBeenCalledWith("/api/admin/columns/delete-me", {
        method: "DELETE",
      });
    });
    expect(screen.queryByText("删掉专栏")).not.toBeInTheDocument();
    expect(screen.getByText("保留专栏")).toBeInTheDocument();
    expect(mocks.toastSuccess).toHaveBeenCalledWith("已删除「删掉专栏」");
  });
});

function renderTable({
  columns = [column()],
}: {
  columns?: ColumnRow[];
} = {}) {
  return render(<ColumnsTable initialColumns={columns} />);
}

function column(overrides: Partial<ColumnRow> = {}): ColumnRow {
  return {
    id: "column-1",
    slug: "column-1",
    name: "默认专栏",
    description: null,
    cover: null,
    order: 1,
    postCount: 0,
    createdAt: new Date("2026-05-21T00:00:00.000Z"),
    ...overrides,
  };
}

function okResponse() {
  return new Response("{}", { status: 200 });
}
