import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentType, ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: { label: string; href?: string; onClick?: () => void };
}

describe("EmptyState", () => {
  it("renders title, description, icon, and link action", async () => {
    const { EmptyState } = await loadEmptyState();

    render(
      <EmptyState
        icon={<span aria-hidden="true">#</span>}
        title="暂无文章"
        description="点击「新建文章」开始创建"
        action={{ label: "新建文章", href: "/admin/entries/new" }}
      />,
    );

    expect(screen.getByText("暂无文章")).toBeInTheDocument();
    expect(screen.getByText("点击「新建文章」开始创建")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "新建文章" })).toHaveAttribute(
      "href",
      "/admin/entries/new",
    );
  });

  it("renders a button action when onClick is provided", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const { EmptyState } = await loadEmptyState();

    render(<EmptyState title="还没有专栏" action={{ label: "创建", onClick }} />);

    await user.click(screen.getByRole("button", { name: "创建" }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

async function loadEmptyState(): Promise<{
  EmptyState: ComponentType<EmptyStateProps>;
}> {
  const modulePath = "./EmptyState";
  return (await import(modulePath)) as {
    EmptyState: ComponentType<EmptyStateProps>;
  };
}
