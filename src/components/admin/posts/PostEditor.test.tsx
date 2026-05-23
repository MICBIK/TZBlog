import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  PostEditor,
  type PostEditorInitial,
  type PostEditorMode,
} from "./PostEditor";

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

vi.mock("@/components/editor/MarkdownEditorWithPreview", () => ({
  MarkdownEditorWithPreview: ({
    value,
    onChange,
    onSave,
  }: {
    value: string;
    onChange: (value: string) => void;
    onSave?: () => void;
  }) => (
    <div>
      <textarea
        aria-label="正文"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <button type="button" onClick={() => onSave?.()}>
        editor shortcut save
      </button>
    </div>
  ),
}));

vi.mock("./PostMetaSidebar", () => ({
  PostMetaSidebar: ({
    meta,
    setMeta,
  }: {
    meta: {
      slug: string;
      cover: string;
      status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
      publishedAt: string;
      columnId: string | null;
      tags: string[];
    };
    setMeta: (next: {
      slug: string;
      cover: string;
      status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
      publishedAt: string;
      columnId: string | null;
      tags: string[];
    }) => void;
  }) => (
    <aside>
      <label htmlFor="mock-slug">slug</label>
      <input
        id="mock-slug"
        value={meta.slug}
        onChange={(event) => setMeta({ ...meta, slug: event.target.value })}
      />
      <div data-testid="mock-status">{meta.status}</div>
    </aside>
  ),
}));

vi.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
  DropdownMenuItem: ({
    children,
    onSelect,
  }: {
    children: ReactNode;
    onSelect?: (event: { preventDefault: () => void }) => void;
  }) => (
    <button type="button" onClick={() => onSelect?.({ preventDefault: vi.fn() })}>
      {children}
    </button>
  ),
  DropdownMenuTrigger: ({ children }: { children: ReactNode }) => (
    <>{children}</>
  ),
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("fetch", mocks.fetch);
  mocks.fetch.mockResolvedValue(okPostResponse("saved-id"));
});

describe("PostEditor", () => {
  it("creates and publishes a post, then navigates to the edit page", async () => {
    const user = userEvent.setup();
    mocks.fetch.mockResolvedValue(okPostResponse("new-id"));
    renderEditor({ mode: "create" });

    await user.click(screen.getByRole("button", { name: "发布" }));

    await waitFor(() => {
      expect(mocks.fetch).toHaveBeenCalledTimes(1);
    });
    const [url, init] = mocks.fetch.mock.calls[0];
    expect(url).toBe("/api/admin/posts");
    expect(init).toMatchObject({
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    expect(JSON.parse(init.body as string)).toMatchObject({
      slug: "post-editor",
      status: "PUBLISHED",
      translations: [{ locale: "zh", title: "编辑器文章" }],
    });
    await waitFor(() => {
      expect(mocks.push).toHaveBeenCalledWith("/admin/posts/new-id/edit");
    });
  });

  it("saves an edit as draft and shows a success toast", async () => {
    const user = userEvent.setup();
    renderEditor({ mode: "edit", initial: initialPost({ id: "post-1" }) });

    await user.click(screen.getByRole("button", { name: "保存草稿" }));

    await waitFor(() => {
      expect(mocks.fetch).toHaveBeenCalledTimes(1);
    });
    const [url, init] = mocks.fetch.mock.calls[0];
    expect(url).toBe("/api/admin/posts/post-1");
    expect(init.method).toBe("PATCH");
    expect(JSON.parse(init.body as string).status).toBe("DRAFT");
    expect(mocks.toastSuccess).toHaveBeenCalledWith("已保存草稿");
  });

  it("submits unchanged complex markdown content from editor save", async () => {
    const user = userEvent.setup();
    const content = [
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
      "<kbd>⌘</kbd> + <kbd>K</kbd>",
    ].join("\n");
    renderEditor({ mode: "edit", initial: initialPost({ id: "post-1", content }) });

    await user.click(screen.getByRole("button", { name: "editor shortcut save" }));

    await waitFor(() => {
      expect(mocks.fetch).toHaveBeenCalledTimes(1);
    });
    const [, init] = mocks.fetch.mock.calls[0];
    expect(JSON.parse(init.body as string).translations[0].content).toBe(content);
  });

  it("rejects an empty title without calling fetch", async () => {
    const user = userEvent.setup();
    renderEditor({ mode: "create", initial: initialPost({ title: "" }) });

    await user.click(screen.getByRole("button", { name: "发布" }));

    expect(mocks.toastError).toHaveBeenCalledWith("标题不能为空");
    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it("rejects an invalid slug without calling fetch", async () => {
    const user = userEvent.setup();
    renderEditor({ mode: "create", initial: initialPost({ slug: "Bad Slug" }) });

    await user.click(screen.getByRole("button", { name: "发布" }));

    expect(mocks.toastError).toHaveBeenCalledWith(
      "slug 只能包含小写字母、数字和连字符",
    );
    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it("maps backend CONFLICT responses to the slug-used toast", async () => {
    const user = userEvent.setup();
    mocks.fetch.mockResolvedValue(errorResponse(409, "CONFLICT"));
    renderEditor({ mode: "create" });

    await user.click(screen.getByRole("button", { name: "发布" }));

    await waitFor(() => {
      expect(mocks.toastError).toHaveBeenCalledWith("slug 已被使用");
    });
  });

  it("shows the network error toast when fetch throws", async () => {
    const user = userEvent.setup();
    mocks.fetch.mockRejectedValue(new Error("offline"));
    renderEditor({ mode: "create" });

    await user.click(screen.getByRole("button", { name: "发布" }));

    await waitFor(() => {
      expect(mocks.toastError).toHaveBeenCalledWith("网络异常，请稍后再试");
    });
  });

  it("hides the more menu in create mode and shows archive in edit mode", () => {
    const { rerender } = renderEditor({ mode: "create" });

    expect(screen.queryByRole("button", { name: "更多" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "归档" })).not.toBeInTheDocument();

    rerender(
      <PostEditor
        mode="edit"
        initial={initialPost({ id: "post-1" })}
        columns={[]}
        allTags={[]}
      />,
    );

    expect(screen.getByRole("button", { name: "更多" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "归档" })).toBeInTheDocument();
  });
});

function renderEditor({
  mode,
  initial = initialPost(),
}: {
  mode: PostEditorMode;
  initial?: PostEditorInitial;
}) {
  return render(
    <PostEditor mode={mode} initial={initial} columns={[]} allTags={[]} />,
  );
}

function initialPost(
  overrides: Partial<PostEditorInitial> = {},
): PostEditorInitial {
  return {
    id: "post-editor-id",
    slug: "post-editor",
    cover: null,
    status: "DRAFT",
    publishedAt: null,
    columnId: null,
    tags: ["react"],
    title: "编辑器文章",
    excerpt: "摘要",
    content: "正文",
    ...overrides,
  };
}

function okPostResponse(id: string) {
  return new Response(JSON.stringify({ data: { id } }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function errorResponse(status: number, code: string) {
  return new Response(JSON.stringify({ error: { code } }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
