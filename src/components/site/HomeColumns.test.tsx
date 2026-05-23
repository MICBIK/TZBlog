import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentLocale: vi.fn(),
  listColumnsForLocale: vi.fn(),
  countPostsInColumn: vi.fn(),
}));

vi.mock("@/lib/i18n", () => ({
  getCurrentLocale: mocks.getCurrentLocale,
}));

vi.mock("@/lib/services/columns", () => ({
  listColumnsForLocale: mocks.listColumnsForLocale,
  countPostsInColumn: mocks.countPostsInColumn,
}));

const modulePath = "./HomeColumns";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getCurrentLocale.mockReturnValue("zh");
  mocks.listColumnsForLocale.mockResolvedValue(
    Array.from({ length: 8 }, (_, index) => ({
      id: `c${index + 1}`,
      slug: `column-${index + 1}`,
      cover: null,
      order: index,
      createdAt: new Date("2026-05-01T00:00:00Z"),
      updatedAt: new Date("2026-05-01T00:00:00Z"),
      name: `专栏 ${index + 1}`,
      description: `关于工程实践 ${index + 1}`,
    })),
  );
  mocks.countPostsInColumn.mockImplementation((id: string) => {
    if (id === "c3") return Promise.resolve(0);
    return Promise.resolve(Number(id.replace("c", "")));
  });
});

describe("<HomeColumns />", () => {
  it("renders up to 6 non-empty column cards with launch-panel", async () => {
    const { container } = render(await homeColumns());

    expect(screen.getByRole("heading", { level: 2, name: "专栏" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "全部专栏 →" })).toHaveAttribute(
      "href",
      "/columns",
    );
    expect(container.querySelectorAll(".launch-panel")).toHaveLength(6);
    expect(screen.queryByText("专栏 3")).not.toBeInTheDocument();
    expect(screen.queryByText("专栏 8")).not.toBeInTheDocument();
  });

  it("counts posts for each locale column and hides empty columns", async () => {
    render(await homeColumns());

    expect(mocks.listColumnsForLocale).toHaveBeenCalledWith("zh");
    expect(mocks.countPostsInColumn).toHaveBeenCalledTimes(8);
    expect(screen.getByText("1 articles")).toBeInTheDocument();
    expect(screen.getByText("2 articles")).toBeInTheDocument();
  });

  it("keeps the section shell when every column is empty", async () => {
    mocks.countPostsInColumn.mockResolvedValue(0);

    const { container } = render(await homeColumns());

    expect(screen.getByRole("heading", { level: 2, name: "专栏" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "全部专栏 →" })).toHaveAttribute(
      "href",
      "/columns",
    );
    expect(container.querySelectorAll(".launch-panel")).toHaveLength(0);
    expect(screen.getByText("还没有可展示的专栏。")).toBeInTheDocument();
  });
});

async function homeColumns() {
  const { HomeColumns } = (await vi.importActual(modulePath)) as {
    HomeColumns: () => Promise<ReactNode>;
  };
  return HomeColumns();
}
