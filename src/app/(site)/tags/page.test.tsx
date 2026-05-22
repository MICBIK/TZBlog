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
  it("TagsPage renders all tags with count + Link to /tags/{slug}", async () => {
    const { TagsPage } = await loadTagsPage();

    render(await TagsPage({}));

    expect(screen.getByText("TAGS · INDEX")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Tags" })).toBeInTheDocument();
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

    expect(screen.getByRole("heading", { level: 1, name: "Tags" })).toBeInTheDocument();
    expect(screen.getByText("No tags yet.")).toBeInTheDocument();
  });

  it("TagsPage exports metadata", async () => {
    const { metadata } = await loadTagsPage();

    expect(metadata.title).toBe("Tags");
    expect(metadata.description).toBeTruthy();
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
