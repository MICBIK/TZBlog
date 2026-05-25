import { render, screen } from "@testing-library/react";
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
});
