import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

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
});
