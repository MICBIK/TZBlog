import { render, screen } from "@testing-library/react";
import type { ComponentType } from "react";
import { describe, expect, it, vi } from "vitest";

const aboutFutureRoadmapModulePath = "./AboutFutureRoadmap";

describe("<AboutFutureRoadmap />", () => {
  it("renders current/V2/V3 columns with i18n disclosure", async () => {
    const { container } = render(
      await aboutFutureRoadmap({
        columns: roadmapColumns,
        i18nDisclosure,
      }),
    );

    expect(
      screen.getByRole("heading", { level: 2, name: "Roadmap" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Current" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "V2" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "V3" })).toBeInTheDocument();
    expect(screen.getByText("Theme GUI")).toBeInTheDocument();
    expect(screen.getByText("Multilingual i18n")).toBeInTheDocument();
    expect(container.querySelectorAll("article.launch-panel")).toHaveLength(3);
    expect(screen.getByText(i18nDisclosure)).toBeInTheDocument();
  });

  it("contains '中文单语言' explicit text", async () => {
    render(
      await aboutFutureRoadmap({
        columns: roadmapColumns,
        i18nDisclosure,
      }),
    );

    expect(screen.getByText(/中文单语言/)).toBeInTheDocument();
    expect(screen.getByText(/数据模型预留/)).toBeInTheDocument();
    expect(screen.getByText(i18nDisclosure)).toHaveTextContent("V3");
  });
});

const roadmapColumns = [
  {
    phase: "Current",
    items: [
      {
        label: "MVP",
        description: "CMS, comments, analytics, RSS, sitemap, and deployment docs.",
      },
    ],
  },
  {
    phase: "V2",
    items: [
      {
        label: "Theme GUI",
        description: "Admin-managed tokens and visual presets.",
      },
    ],
  },
  {
    phase: "V3",
    items: [
      {
        label: "Multilingual i18n",
        description: "Locale routing, dictionaries, metadata, RSS, and sitemap.",
      },
    ],
  },
];

const i18nDisclosure =
  "TZBlog 目前是一个中文单语言（zh-CN）个人技术博客。数据模型预留了多语言能力，但当前 UI、SEO、RSS、sitemap、后台编辑均未启用多语言路径。V3 将作为独立 SDD 处理。";

async function aboutFutureRoadmap(props: {
  columns: Array<{
    phase: string;
    items: Array<{
      label: string;
      description: string;
    }>;
  }>;
  i18nDisclosure: string;
}) {
  const { AboutFutureRoadmap } = (await vi.importActual(
    aboutFutureRoadmapModulePath,
  )) as {
    AboutFutureRoadmap: ComponentType<typeof props>;
  };

  return <AboutFutureRoadmap {...props} />;
}
