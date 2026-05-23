import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ColumnCard } from "./ColumnCard";

describe("ColumnCard cover", () => {
  it("rendersStableCoverFrameWhenCoverExists", () => {
    const { container } = render(
      <ColumnCard
        slug="engineering-notes"
        name="工程札记"
        description="记录工程取舍。"
        cover="/showcase/cover-engineering.png"
        postCount={2}
      />,
    );

    const link = screen.getByRole("link", { name: /工程札记/ });
    const img = screen.getByRole("img", { name: "工程札记" });
    const frame = container.querySelector("[data-column-cover]");

    expect(link).toHaveAttribute("href", "/columns/engineering-notes");
    expect(frame).toHaveClass("aspect-[16/9]", "overflow-hidden");
    expect(img).toHaveAttribute("src", "/showcase/cover-engineering.png");
    expect(img).toHaveAttribute("loading", "lazy");
    expect(img).toHaveAttribute("decoding", "async");
    expect(img).toHaveClass("h-full", "w-full", "object-cover");
  });

  it("keepsCardStableWithoutCover", () => {
    const { container } = render(
      <ColumnCard
        slug="writing-system"
        name="写作系统"
        description={null}
        cover={null}
        postCount={1}
      />,
    );

    expect(screen.getByRole("link", { name: /写作系统/ })).toHaveAttribute(
      "href",
      "/columns/writing-system",
    );
    expect(container.querySelector("[data-column-cover]")).not.toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByText("1 篇文章")).toBeInTheDocument();
  });
});
