import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentType } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  deleteMediaById: vi.fn(),
  refresh: vi.fn(),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
  uploadMediaFile: vi.fn(),
}));

vi.mock("@/lib/media-client", () => ({
  deleteMediaById: mocks.deleteMediaById,
  uploadMediaFile: mocks.uploadMediaFile,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));

vi.mock("sonner", () => ({
  toast: {
    error: mocks.toastError,
    success: mocks.toastSuccess,
  },
}));

type DropzoneModule = {
  MediaUploadDropzone: ComponentType;
};

async function loadDropzone(): Promise<DropzoneModule> {
  const modulePath = "./MediaUploadDropzone";
  return (await import(modulePath)) as DropzoneModule;
}

function pngFile(name = "one.png"): File {
  return new File(["png"], name, { type: "image/png" });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("MediaUploadDropzone render", () => {
  it("renders a button dropzone with test id and aria-label", async () => {
    const { MediaUploadDropzone } = await loadDropzone();

    render(<MediaUploadDropzone />);

    expect(screen.getByTestId("media-upload-dropzone")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "上传媒体文件" }),
    ).toBeInTheDocument();
  });
});

describe("MediaUploadDropzone keyboard trigger", () => {
  it("opens the file input with Enter and Space", async () => {
    const { MediaUploadDropzone } = await loadDropzone();
    const user = userEvent.setup();
    const clickSpy = vi
      .spyOn(HTMLInputElement.prototype, "click")
      .mockImplementation(() => {});

    render(<MediaUploadDropzone />);

    screen.getByTestId("media-upload-dropzone").focus();
    await user.keyboard("{Enter}");
    expect(clickSpy).toHaveBeenCalledTimes(1);

    clickSpy.mockClear();
    await user.keyboard(" ");
    expect(clickSpy).toHaveBeenCalledTimes(1);
  });
});

describe("MediaUploadDropzone single file success", () => {
  it("uploads one file, shows success toast, and refreshes the route", async () => {
    const { MediaUploadDropzone } = await loadDropzone();
    const user = userEvent.setup();
    mocks.uploadMediaFile.mockResolvedValue("/uploads/2026/05/one.png");

    const { container } = render(<MediaUploadDropzone />);
    const input = container.querySelector('input[type="file"]');
    expect(input).toBeInstanceOf(HTMLInputElement);

    await user.upload(input as HTMLInputElement, pngFile());

    await waitFor(() => {
      expect(mocks.uploadMediaFile).toHaveBeenCalledWith(expect.any(File));
    });
    expect(mocks.toastSuccess).toHaveBeenCalledWith("已上传 1 个文件");
    expect(mocks.refresh).toHaveBeenCalledTimes(1);
  });
});

describe("MediaUploadDropzone single file failure", () => {
  it("shows the upload error and does not refresh", async () => {
    const { MediaUploadDropzone } = await loadDropzone();
    const user = userEvent.setup();
    mocks.uploadMediaFile.mockRejectedValue(new Error("size too big"));

    const { container } = render(<MediaUploadDropzone />);
    const input = container.querySelector('input[type="file"]');
    expect(input).toBeInstanceOf(HTMLInputElement);

    await user.upload(input as HTMLInputElement, pngFile());

    await waitFor(() => {
      expect(mocks.toastError).toHaveBeenCalledWith(
        expect.stringContaining("size too big"),
      );
    });
    expect(mocks.refresh).not.toHaveBeenCalled();
  });
});

describe("MediaUploadDropzone multiple file upload", () => {
  it("uploads multiple files in input order", async () => {
    const { MediaUploadDropzone } = await loadDropzone();
    const user = userEvent.setup();
    const files = [pngFile("one.png"), pngFile("two.png"), pngFile("three.png")];
    mocks.uploadMediaFile.mockResolvedValue("/uploads/2026/05/file.png");

    const { container } = render(<MediaUploadDropzone />);
    const input = container.querySelector('input[type="file"]');
    expect(input).toBeInstanceOf(HTMLInputElement);

    await user.upload(input as HTMLInputElement, files);

    await waitFor(() => {
      expect(mocks.uploadMediaFile).toHaveBeenCalledTimes(3);
    });
    expect(mocks.uploadMediaFile.mock.calls.map(([file]) => file.name)).toEqual([
      "one.png",
      "two.png",
      "three.png",
    ]);
  });
});

describe("MediaUploadDropzone partial failures", () => {
  it("continues after a failed file and reports the failure count", async () => {
    const { MediaUploadDropzone } = await loadDropzone();
    const user = userEvent.setup();
    const files = [pngFile("one.png"), pngFile("two.png"), pngFile("three.png")];
    mocks.uploadMediaFile
      .mockResolvedValueOnce("/uploads/2026/05/one.png")
      .mockRejectedValueOnce(new Error("bad file"))
      .mockResolvedValueOnce("/uploads/2026/05/three.png");

    const { container } = render(<MediaUploadDropzone />);
    const input = container.querySelector('input[type="file"]');
    expect(input).toBeInstanceOf(HTMLInputElement);

    await user.upload(input as HTMLInputElement, files);

    await waitFor(() => {
      expect(mocks.uploadMediaFile).toHaveBeenCalledTimes(3);
    });
    expect(mocks.toastError).toHaveBeenCalledWith(
      expect.stringContaining("1 个文件上传失败"),
    );
    expect(mocks.toastError).toHaveBeenCalledWith(
      expect.stringContaining("two.png"),
    );
  });
});
