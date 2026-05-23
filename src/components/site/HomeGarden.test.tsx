import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";

import { HomeGarden } from "./HomeGarden";

describe("<HomeGarden />", () => {
  it("handlesLoadingEmptyAndErrorStates", () => {
    render(
      <HomeGarden
        hero={<section>Hero ready</section>}
        featuredAndRecent={moduleState(
          "loading",
          "文章加载中",
          "正在读取最新文章。",
        )}
        columns={moduleState(
          "empty",
          "项目入口暂未配置",
          "保留稳定占位，避免首页出现空白区域。",
        )}
        principles={<section>Principles ready</section>}
        techStack={<section>Tech stack ready</section>}
        github={moduleState(
          "error",
          "GitHub 数据暂不可用",
          "外部数据失败时首页仍要可读。",
        )}
        stats={moduleState(
          "loading",
          "站点统计加载中",
          "正在计算访问和发布数据。",
        )}
      />,
    );

    expect(
      screen.getByRole("status", { name: "文章模块状态" }),
    ).toHaveAttribute("data-home-module-state", "loading");
    expect(screen.getByText("文章加载中")).toBeInTheDocument();

    expect(
      screen.getByRole("status", { name: "项目模块状态" }),
    ).toHaveAttribute("data-home-module-state", "empty");
    expect(screen.getByText("项目入口暂未配置")).toBeInTheDocument();

    expect(
      screen.getByRole("alert", { name: "GitHub模块状态" }),
    ).toHaveAttribute("data-home-module-state", "error");
    expect(screen.getByText("GitHub 数据暂不可用")).toBeInTheDocument();

    expect(
      screen.getByRole("status", { name: "统计模块状态" }),
    ).toHaveAttribute("data-home-module-state", "loading");
    expect(screen.getByText("站点统计加载中")).toBeInTheDocument();
  });
});

function moduleState(
  state: "loading" | "empty" | "error",
  title: string,
  detail: string,
): ReactNode {
  return { state, title, detail } as unknown as ReactNode;
}
