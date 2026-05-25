import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
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
});
