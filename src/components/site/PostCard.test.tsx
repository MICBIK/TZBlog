import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PostCard } from "./PostCard";

type PostCardPost = Parameters<typeof PostCard>[0]["post"];

describe("PostCard cover", () => {
  it("renders cover img with alt and lazy when cover set", () => {
    render(<PostCard post={post({ cover: "/uploads/2026/05/cover.png" })} />);

    const img = screen.getByRole("img", { name: "Cover Title" });
    expect(img).toHaveAttribute("src", "/uploads/2026/05/cover.png");
    expect(img).toHaveAttribute("loading", "lazy");
    expect(img).toHaveClass("h-full", "w-full", "object-cover");
  });

  it("does not render cover area when cover is null", () => {
    render(<PostCard post={post({ cover: null })} />);

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});

function post(overrides: { cover: string | null }): PostCardPost {
  return {
    slug: "cover-post",
    title: "Cover Title",
    excerpt: "Cover excerpt",
    publishedAt: new Date("2026-05-21T00:00:00Z"),
    columnName: null,
    tags: [],
    ...overrides,
  } as unknown as PostCardPost;
}
