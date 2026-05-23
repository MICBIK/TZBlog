import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  listMedia: vi.fn(),
}));

vi.mock("@/lib/services/media", () => ({
  listMedia: mocks.listMedia,
}));

vi.mock("@/components/admin/media/MediaUploadDropzone", () => ({
  MediaUploadDropzone: () => <div data-testid="media-upload-dropzone" />,
}));

vi.mock("@/components/admin/media/MediaCard", () => ({
  MediaCard: () => <div data-testid="media-card" />,
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.listMedia.mockResolvedValue({
    items: [],
    total: 0,
    page: 1,
    pageSize: 12,
  });
});

describe("MediaAdminPage", () => {
  it("renders the unified empty state", async () => {
    const { default: MediaAdminPage } = await import("./page");

    render(await MediaAdminPage({ searchParams: Promise.resolve({}) }));

    expect(
      screen.getByText("还没有媒体 · 在文章里上传图片自动归档"),
    ).toBeInTheDocument();
  });
});
