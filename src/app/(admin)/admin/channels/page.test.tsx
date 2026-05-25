import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  listChannels: vi.fn(),
  fetch: vi.fn(),
  push: vi.fn(),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock("@/lib/services/channels", () => ({
  listChannels: mocks.listChannels,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
}));

vi.mock("sonner", () => ({
  toast: {
    error: mocks.toastError,
    success: mocks.toastSuccess,
  },
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
  vi.stubGlobal("fetch", mocks.fetch);
  mocks.fetch.mockResolvedValue(new Response("{}", { status: 200 }));
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

  it("upArrowSwapsOrder", async () => {
    const user = userEvent.setup();
    const { ChannelsTable: RealChannelsTable } = await vi.importActual<
      typeof import("@/components/admin/channels/ChannelsTable")
    >("@/components/admin/channels/ChannelsTable");

    render(
      <RealChannelsTable
        initialChannels={[
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
        ]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "上移 stream" }));

    await waitFor(() => {
      expect(mocks.fetch).toHaveBeenCalledWith("/api/admin/channels/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: ["channel-2", "channel-1"] }),
      });
    });

    const rows = screen.getAllByTestId("channel-row");
    expect(rows[0]).toHaveAttribute("data-slug", "stream");
    expect(rows[1]).toHaveAttribute("data-slug", "articles");
  });
});
