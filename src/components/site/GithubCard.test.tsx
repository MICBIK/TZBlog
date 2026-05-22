import { render, screen, within } from "@testing-library/react";
import type { ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getGithubData } from "@/lib/services/github";

vi.mock("@/lib/services/github", () => ({
  getGithubData: vi.fn(),
}));

const githubCardModulePath = "./GithubCard";

describe("<GithubCard />", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GithubCard success state renders all fields", async () => {
    vi.mocked(getGithubData).mockResolvedValue(okGithubData());

    render(await githubCard());

    expect(screen.getByText("GITHUB · DEVELOPMENT")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "ha1den" })).toHaveAttribute(
      "href",
      "https://github.com/ha1den",
    );
    expect(screen.getByText("Building TZBlog from scratch")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("TZBlog")).toBeInTheDocument();
    expect(screen.getByText("Personal blog")).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(4);
  });

  it("GithubCard fallback state renders gracefully", async () => {
    vi.mocked(getGithubData).mockResolvedValue({
      status: "unavailable",
      reason: "missing_env",
    });

    render(await githubCard());

    expect(screen.getByText("GITHUB · DEVELOPMENT")).toBeInTheDocument();
    expect(screen.getByText("GitHub data unavailable")).toBeInTheDocument();
    expect(screen.getByText(/Set GITHUB_USERNAME/)).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("GithubCard Editorial styling includes hairline, rule line, and hierarchy", async () => {
    vi.mocked(getGithubData).mockResolvedValue(okGithubData());

    const { container } = render(await githubCard());
    const label = screen.getByText("GITHUB · DEVELOPMENT");
    const number = screen.getByText("42");
    const repo = screen.getByText("TZBlog");

    expect(label).toHaveClass("uppercase");
    expect(label).toHaveClass("text-label");
    expect(label).toHaveClass("tracking-label");
    expect(number).toHaveClass("text-h2");
    expect(repo.className).toContain("font-serif");
    expect(
      container.querySelector('[class*="w-12"][class*="border-t"][class*="border-border"]'),
    ).toBeInTheDocument();
  });

  it("GithubCard a11y attrs include avatar dimensions and external link rel", async () => {
    vi.mocked(getGithubData).mockResolvedValue(okGithubData());

    render(await githubCard());

    const img = screen.getByRole("img", { name: "ha1den avatar" });
    expect(img).toHaveAttribute("src", "https://github.com/ha1den.png");
    expect(img).toHaveAttribute("width", "48");
    expect(img).toHaveAttribute("height", "48");
    expect(img).toHaveAttribute("loading", "lazy");

    const profileLink = screen.getByRole("link", { name: "ha1den" });
    expect(profileLink).toHaveAttribute("target", "_blank");
    expect(profileLink).toHaveAttribute("rel", "noopener noreferrer");

    const repoLink = screen.getByRole("link", { name: /TZBlog/ });
    expect(repoLink).toHaveAttribute("target", "_blank");
    expect(repoLink).toHaveAttribute("rel", "noopener noreferrer");
    expect(within(repoLink).getByText("★ 7")).toBeInTheDocument();
  });
});

async function githubCard() {
  const { GithubCard } = (await vi.importActual(githubCardModulePath)) as {
    GithubCard: () => ReactElement | Promise<ReactElement>;
  };
  return GithubCard();
}

function okGithubData() {
  return {
    status: "ok" as const,
    user: {
      login: "ha1den",
      name: "ha1den",
      bio: "Building TZBlog from scratch",
      avatar_url: "https://github.com/ha1den.png",
      html_url: "https://github.com/ha1den",
      public_repos: 10,
      followers: 5,
    },
    recentCommitCount: 42,
    topRepos: [
      {
        name: "TZBlog",
        html_url: "https://github.com/ha1den/TZBlog",
        description: "Personal blog",
        stargazers_count: 7,
        language: "TypeScript",
      },
      {
        name: "cli-tools",
        html_url: "https://github.com/ha1den/cli-tools",
        description: "Small tools",
        stargazers_count: 3,
        language: "Rust",
      },
      {
        name: "notes",
        html_url: "https://github.com/ha1den/notes",
        description: null,
        stargazers_count: 1,
        language: null,
      },
    ],
  };
}
