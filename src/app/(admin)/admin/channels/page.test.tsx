import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  listChannels: vi.fn(),
}));

vi.mock("@/lib/services/channels", () => ({
  listChannels: mocks.listChannels,
}));

vi.mock("@/components/admin/channels/ChannelsTable", () => ({
  ChannelsTable: ({
    initialChannels,
  }: {
    initialChannels: Array<{
      id: string;
      order: number;
      slug: string;
      kind: string;
      layout: string;
      enabled: boolean;
      entryCount: number;
    }>;
  }) => (
    <div
      data-testid="channels-table"
      data-count={String(initialChannels.length)}
      data-first-slug={initialChannels[0]?.slug ?? ""}
      data-first-order={String(initialChannels[0]?.order ?? "")}
    />
  ),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.listChannels.mockResolvedValue([
    {
      id: "channel-1",
      order: 0,
      slug: "articles",
      kind: "ARTICLES",
      layout: "CHRONICLE",
      enabled: true,
      entryCount: 4,
    },
    {
      id: "channel-2",
      order: 1,
      slug: "stream",
      kind: "STREAM",
      layout: "GREP",
      enabled: true,
      entryCount: 8,
    },
  ]);
});

describe("ChannelsAdminPage", () => {
  it("listShowsAllChannelsByOrder", async () => {
    const { default: ChannelsAdminPage } = await import("./page");

    render(await ChannelsAdminPage());

    expect(screen.getByRole("heading", { name: "频道管理" })).toBeInTheDocument();
    expect(screen.getByText("管理内容频道与前台信息架构。")).toBeInTheDocument();

    const table = screen.getByTestId("channels-table");
    expect(table).toHaveAttribute("data-count", "2");
    expect(table).toHaveAttribute("data-first-slug", "articles");
    expect(table).toHaveAttribute("data-first-order", "0");
    expect(mocks.listChannels).toHaveBeenCalledTimes(1);
  });
});
