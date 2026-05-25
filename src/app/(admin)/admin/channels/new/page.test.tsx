import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  fetch: vi.fn(),
  push: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("fetch", mocks.fetch);
  mocks.fetch.mockResolvedValue(
    new Response(
      JSON.stringify({ data: { id: "channel-new-id" } }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    ),
  );
});

describe("ChannelCreatePage", () => {
  it("renders5StepForm", async () => {
    const { default: ChannelCreatePage } = await import("./page");

    render(<ChannelCreatePage />);

    expect(screen.getByRole("heading", { name: "新建频道" })).toBeInTheDocument();
    expect(screen.getByText("Slug")).toBeInTheDocument();
    expect(screen.getByText("频道类型")).toBeInTheDocument();
    expect(screen.getByText("布局")).toBeInTheDocument();
    expect(screen.getByText("主题与强调")).toBeInTheDocument();
    expect(screen.getByText("翻译")).toBeInTheDocument();
    expect(screen.getByText("可见性")).toBeInTheDocument();
  });

  it("notesKindFiltersLayoutsToTimelineFeed", async () => {
    const user = userEvent.setup();
    const { default: ChannelCreatePage } = await import("./page");

    render(<ChannelCreatePage />);

    await user.selectOptions(screen.getByLabelText("频道类型"), "NOTES");

    const layout = screen.getByLabelText("布局");
    expect(screen.getByRole("option", { name: "TIMELINE" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "FEED" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "CHRONICLE" })).not.toBeInTheDocument();
    expect(layout).toHaveValue("TIMELINE");
  });

  it("guestbookKindRejectedFromManualCreation", async () => {
    const user = userEvent.setup();
    const { default: ChannelCreatePage } = await import("./page");

    render(<ChannelCreatePage />);

    await user.selectOptions(screen.getByLabelText("频道类型"), "GUESTBOOK");

    expect(
      screen.getByText("GUESTBOOK 由 seed 创建，admin 不能新建"),
    ).toBeInTheDocument();
  });

  it("submitValidFormCreatesAndRedirects", async () => {
    const user = userEvent.setup();
    const { default: ChannelCreatePage } = await import("./page");

    render(<ChannelCreatePage />);

    await user.type(screen.getByLabelText("Slug"), "smoke-test");
    await user.selectOptions(screen.getByLabelText("频道类型"), "NOTES");
    await user.click(screen.getByRole("button", { name: "创建频道" }));

    expect(mocks.fetch).toHaveBeenCalledWith("/api/admin/channels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: "smoke-test",
        kind: "NOTES",
        layout: "TIMELINE",
      }),
    });
    expect(mocks.push).toHaveBeenCalledWith("/admin/channels/channel-new-id/edit");
  });
});
