import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentLocale: vi.fn(),
  listAllTagsWithCount: vi.fn(),
}));

vi.mock("@/lib/i18n", () => ({
  getCurrentLocale: mocks.getCurrentLocale,
}));

vi.mock("@/lib/services/tags-public", () => ({
  listAllTagsWithCount: mocks.listAllTagsWithCount,
}));

const tagsPageModulePath = "./page";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getCurrentLocale.mockReturnValue("zh");
  mocks.listAllTagsWithCount.mockResolvedValue([
    { slug: "foo", name: "Foo", count: 3 },
    { slug: "bar", name: "Bar", count: 1 },
  ]);
});

describe("TagsPage", () => {
  it("rendersChineseSingleLocaleTagsIndex", async () => {
    const { TagsPage } = await loadTagsPage();

    render(await TagsPage({}));

    expect(screen.getByText("标签 · 索引")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "标签" })).toBeInTheDocument();
    expect(screen.getByText("按主题浏览所有已发布文章。")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Foo/ })).toHaveAttribute(
      "href",
      "/tags/foo",
    );
    expect(screen.getByRole("link", { name: /Bar/ })).toHaveAttribute(
      "href",
      "/tags/bar",
    );
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(mocks.listAllTagsWithCount).toHaveBeenCalledWith("zh");
  });

  it("TagsPage empty state", async () => {
    mocks.listAllTagsWithCount.mockResolvedValue([]);
    const { TagsPage } = await loadTagsPage();

    render(await TagsPage({}));

    expect(screen.getByRole("heading", { level: 1, name: "标签" })).toBeInTheDocument();
    expect(screen.getByText("还没有标签。")).toBeInTheDocument();
  });

  it("TagsPage exports metadata", async () => {
    const { metadata } = await loadTagsPage();

    expect(metadata.title).toBe("标签 — TZBlog");
    expect(metadata.description).toBe("所有文章标签");
  });
});

async function loadTagsPage() {
  const pageModule = (await vi.importActual(tagsPageModulePath)) as {
    default: (props: Record<string, never>) => ReactElement | Promise<ReactElement>;
    metadata: {
      title: string;
      description: string;
    };
  };

  return {
    TagsPage: pageModule.default,
    metadata: pageModule.metadata,
  };
}
