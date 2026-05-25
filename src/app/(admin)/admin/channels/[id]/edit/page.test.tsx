import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  fetch: vi.fn(),
  getChannelById: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  push: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("@/lib/services/channels", () => ({
  getChannelById: mocks.getChannelById,
}));

vi.mock("next/navigation", () => ({
  notFound: mocks.notFound,
  useRouter: () => ({
    push: mocks.push,
    refresh: mocks.refresh,
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("fetch", mocks.fetch);
  mocks.fetch.mockResolvedValue(
    new Response(JSON.stringify({ data: { id: "channel-1" } }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }),
  );
  mocks.getChannelById.mockResolvedValue({
    id: "channel-1",
    slug: "stream",
    kind: "STREAM",
    layout: "FEED",
    enabled: true,
    translations: [{ locale: "zh", name: "碎片流", description: "最新碎片" }],
  });
});

describe("ChannelEditPage", () => {
  it("editFormPrefillsValues", async () => {
    const { default: ChannelEditPage } = await import("./page");

    render(await ChannelEditPage({ params: Promise.resolve({ id: "channel-1" }) }));

    expect(screen.getByRole("heading", { name: "编辑频道" })).toBeInTheDocument();
    expect(screen.getByLabelText("Slug")).toHaveValue("stream");
    expect(screen.getByLabelText("频道类型")).toHaveValue("STREAM");
    expect(screen.getByLabelText("布局")).toHaveValue("FEED");
    expect(mocks.getChannelById).toHaveBeenCalledWith("channel-1");
  });

  it("layoutChangeUpdatesFrontend", async () => {
    const user = userEvent.setup();
    const { default: ChannelEditPage } = await import("./page");

    render(await ChannelEditPage({ params: Promise.resolve({ id: "channel-1" }) }));

    await user.selectOptions(screen.getByLabelText("布局"), "GREP");
    await user.click(screen.getByRole("button", { name: "保存更改" }));

    await waitFor(() => {
      expect(mocks.fetch).toHaveBeenCalledWith("/api/admin/channels/channel-1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: "stream",
          kind: "STREAM",
          layout: "GREP",
        }),
      });
    });

    expect(mocks.refresh).toHaveBeenCalledTimes(1);
  });
});
