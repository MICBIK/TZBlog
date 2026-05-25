import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  listChannels: vi.fn(),
  listSeriesOptions: vi.fn(),
  listTags: vi.fn(),
  forbidden: vi.fn(() => {
    throw new Error("NEXT_FORBIDDEN");
  }),
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("@/lib/services/channels", () => ({
  listChannels: mocks.listChannels,
}));

vi.mock("@/lib/services/series", () => ({
  listSeriesOptions: mocks.listSeriesOptions,
}));

vi.mock("@/lib/services/tags", () => ({
  listTags: mocks.listTags,
}));

vi.mock("next/navigation", () => ({
  forbidden: mocks.forbidden,
  notFound: mocks.notFound,
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.listSeriesOptions.mockResolvedValue([]);
  mocks.listTags.mockResolvedValue([]);
  mocks.listChannels.mockResolvedValue([
    {
      id: "channel-guestbook",
      slug: "guestbook",
      enabled: true,
      kind: "GUESTBOOK",
      layout: "FEED",
      translations: [{ locale: "zh", name: "留言板", description: null }],
    },
  ]);
});

describe("NewEntryPage", () => {
  it("guestbookChannelRequestReturns403", async () => {
    const { default: NewEntryPage } = await import("./page");

    await expect(
      NewEntryPage({
        searchParams: Promise.resolve({ channelId: "channel-guestbook" }),
      }),
    ).rejects.toThrow("NEXT_FORBIDDEN");

    expect(mocks.forbidden).toHaveBeenCalledTimes(1);
  });
});
