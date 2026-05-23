import { render, screen, within } from "@testing-library/react";
import type { ComponentType } from "react";
import { describe, expect, it } from "vitest";

interface InteractiveExplainerProps {
  title: string;
  description: string;
  steps: Array<{
    title: string;
    detail: string;
  }>;
  fallback: {
    title: string;
    detail: string;
  };
}

describe("<InteractiveExplainer />", () => {
  it("providesStaticFallbackForInteractiveBlock", async () => {
    const { InteractiveExplainer } = await loadInteractiveExplainer();

    render(
      <InteractiveExplainer
        title="Hash table probe"
        description="解释哈希表冲突和探测过程。"
        fallback={{
          title: "静态示意",
          detail: "无 JS 或 reduced motion 时仍展示线性步骤说明。",
        }}
        steps={[
          { title: "Hash key", detail: "先计算 key 的 hash。" },
          { title: "Probe slot", detail: "冲突时向下一个 slot 探测。" },
        ]}
      />,
    );

    const region = screen.getByRole("region", {
      name: "Hash table probe",
    });
    expect(region).toHaveAttribute("data-interactive-explainer");
    expect(region).toHaveAttribute("data-reduced-motion-safe");
    expect(region).toHaveAttribute("data-static-fallback", "available");

    const fallback = within(region).getByRole("group", {
      name: "静态 fallback",
    });
    expect(fallback).toHaveAttribute("data-explainer-fallback");
    expect(fallback).toHaveTextContent("静态示意");
    expect(fallback).toHaveTextContent("无 JS 或 reduced motion 时仍展示线性步骤说明。");

    const visual = within(region).getByRole("img", {
      name: "Hash table probe 可视化",
    });
    expect(visual).toHaveAttribute("data-explainer-visual");

    expect(
      within(region).getByRole("list", { name: "Hash table probe 步骤" }),
    ).toHaveAttribute("data-explainer-steps");
    expect(within(region).getByText("Hash key")).toBeInTheDocument();
    expect(within(region).getByText("Probe slot")).toBeInTheDocument();
  });
});

type InteractiveExplainerModule = {
  InteractiveExplainer: ComponentType<InteractiveExplainerProps>;
};

async function loadInteractiveExplainer(): Promise<InteractiveExplainerModule> {
  const modulePath = "./InteractiveExplainer";
  return (await import(modulePath)) as InteractiveExplainerModule;
}
