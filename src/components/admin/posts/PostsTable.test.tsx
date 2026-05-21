import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PostListItem } from "@/lib/services/posts";
import { PostsTable } from "./PostsTable";

const mocks = vi.hoisted(() => ({
  fetch: vi.fn(),
  push: vi.fn(),
  refresh: vi.fn(),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }),
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

describe("PostsTable", () => {
  it("renders the empty placeholder", () => {
    renderTable({ items: [] });

    expect(screen.getByText(/暂无文章/)).toBeInTheDocument();
  });

  it("renders status badges for DRAFT, PUBLISHED, and ARCHIVED", () => {
    renderTable({
      items: [
        post({ id: "draft", slug: "draft", status: "DRAFT" }),
        post({ id: "published", slug: "published", status: "PUBLISHED" }),
        post({ id: "archived", slug: "archived", status: "ARCHIVED" }),
      ],
    });

    expect(screen.getByText("草稿")).toBeInTheDocument();
    expect(screen.getByText("已发布")).toBeInTheDocument();
    expect(screen.getByText("已归档")).toBeInTheDocument();
  });

  it("renders the first three tags and folds the rest", () => {
    renderTable({
      items: [
        post({
          tags: [
            { slug: "a", name: "A" },
            { slug: "b", name: "B" },
            { slug: "c", name: "C" },
            { slug: "d", name: "D" },
            { slug: "e", name: "E" },
          ],
        }),
      ],
    });

    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
    expect(screen.getByText("C")).toBeInTheDocument();
    expect(screen.queryByText("D")).not.toBeInTheDocument();
    expect(screen.getByText("+2")).toBeInTheDocument();
  });

  it("inline delete: click 删除 opens AlertDialog without firing DELETE", async () => {
    const user = userEvent.setup();
    renderTable({
      items: [
        post({ id: "delete-me", slug: "delete-me", title: "删掉我" }),
        post({ id: "keep-me", slug: "keep-me", title: "保留我" }),
      ],
      total: 2,
    });

    await user.click(screen.getByRole("button", { name: "操作 delete-me" }));
    await user.click(screen.getAllByRole("button", { name: "删除" })[0]);

    const dialog = screen.getByRole("alertdialog");
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText("确认删除文章")).toBeInTheDocument();
    expect(within(dialog).getByText(/删掉我/)).toBeInTheDocument();
    expect(within(dialog).getByText(/评论/)).toBeInTheDocument();
    expect(within(dialog).getByText(/点赞/)).toBeInTheDocument();
    expect(within(dialog).getByText(/浏览记录/)).toBeInTheDocument();
    expect(within(dialog).getByText(/不可恢复/)).toBeInTheDocument();
    expect(mocks.fetch).not.toHaveBeenCalled();
    expect(screen.getByText("删掉我")).toBeInTheDocument();
  });

  it("inline delete: AlertDialog 取消 → no DELETE + row stays", async () => {
    const user = userEvent.setup();
    renderTable({
      items: [post({ id: "cancel-delete", slug: "cancel-delete", title: "取消删除" })],
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
      items: [
        post({ id: "delete-me", slug: "delete-me", title: "删掉我" }),
        post({ id: "keep-me", slug: "keep-me", title: "保留我" }),
      ],
      total: 2,
    });

    await user.click(screen.getByRole("button", { name: "操作 delete-me" }));
    await user.click(screen.getAllByRole("button", { name: "删除" })[0]);
    await user.click(screen.getByRole("button", { name: /^确认删除$/ }));

    await waitFor(() => {
      expect(mocks.fetch).toHaveBeenCalledWith("/api/admin/posts/delete-me", {
        method: "DELETE",
      });
    });
    expect(screen.queryByText("删掉我")).not.toBeInTheDocument();
    expect(screen.getByText("保留我")).toBeInTheDocument();
    expect(mocks.toastSuccess).toHaveBeenCalledWith("已删除「删掉我」");
  });

  it("optimistically updates DRAFT to PUBLISHED and keeps it after PATCH succeeds", async () => {
    const user = userEvent.setup();
    let resolveFetch!: (value: Response) => void;
    mocks.fetch.mockReturnValue(
      new Promise<Response>((resolve) => {
        resolveFetch = resolve;
      }),
    );
    renderTable({
      items: [post({ id: "publish-me", slug: "publish-me", status: "DRAFT" })],
    });

    await user.click(screen.getByRole("button", { name: "操作 publish-me" }));
    await user.click(screen.getByRole("button", { name: "发布" }));

    expect(screen.getByText("已发布")).toBeInTheDocument();
    expect(mocks.fetch).toHaveBeenCalledWith(
      "/api/admin/posts/publish-me",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ status: "PUBLISHED" }),
      }),
    );

    resolveFetch(okResponse());
    await waitFor(() => {
      expect(mocks.toastSuccess).toHaveBeenCalledWith("已发布「publish-me」");
    });
    expect(screen.getByText("已发布")).toBeInTheDocument();
  });

  it("rolls back the optimistic publish toggle when PATCH fails", async () => {
    const user = userEvent.setup();
    let resolveFetch!: (value: Response) => void;
    mocks.fetch.mockReturnValue(
      new Promise<Response>((resolve) => {
        resolveFetch = resolve;
      }),
    );
    renderTable({
      items: [post({ id: "rollback", slug: "rollback", status: "DRAFT" })],
    });

    await user.click(screen.getByRole("button", { name: "操作 rollback" }));
    await user.click(screen.getByRole("button", { name: "发布" }));

    expect(screen.getByText("已发布")).toBeInTheDocument();
    resolveFetch(new Response("{}", { status: 500 }));

    await waitFor(() => {
      expect(screen.getByText("草稿")).toBeInTheDocument();
    });
    expect(mocks.toastError).toHaveBeenCalledWith("操作失败", {
      description: "HTTP 500",
    });
  });

  it("disables pagination boundaries", () => {
    const { rerender } = renderTable({ page: 1, total: 30, pageSize: 10 });

    expect(screen.getByRole("button", { name: "上一页" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "下一页" })).toBeEnabled();

    rerender(
      <PostsTable
        initialItems={[post()]}
        total={30}
        page={3}
        pageSize={10}
        currentFilter={{ page: 3, pageSize: 10 }}
      />,
    );

    expect(screen.getByRole("button", { name: "上一页" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "下一页" })).toBeDisabled();
  });
});

function renderTable({
  items = [post()],
  total = items.length,
  page = 1,
  pageSize = 10,
}: {
  items?: PostListItem[];
  total?: number;
  page?: number;
  pageSize?: number;
} = {}) {
  return render(
    <PostsTable
      initialItems={items}
      total={total}
      page={page}
      pageSize={pageSize}
      currentFilter={{ page, pageSize }}
    />,
  );
}

function post(overrides: Partial<PostListItem> = {}): PostListItem {
  const id = overrides.id ?? "post-1";
  const slug = overrides.slug ?? id;
  return {
    id,
    slug,
    cover: null,
    status: "DRAFT",
    publishedAt: null,
    columnId: null,
    columnName: null,
    authorName: "作者",
    title: slug,
    excerpt: null,
    tags: [],
    viewCount: 0,
    likeCount: 0,
    commentCount: 0,
    createdAt: new Date("2026-05-21T00:00:00Z"),
    updatedAt: new Date("2026-05-21T00:00:00Z"),
    ...overrides,
  };
}

function okResponse() {
  return new Response("{}", { status: 200 });
}
