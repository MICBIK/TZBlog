import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  getGuestbookThreadForViewer: vi.fn(),
  buildGuestbookMessages: vi.fn(),
  notFound: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("next/navigation", () => ({
  notFound: mocks.notFound,
}));
vi.mock("@/lib/services/guestbook", async () => {
  const actual = await vi.importActual<typeof import("@/lib/services/guestbook")>(
    "@/lib/services/guestbook",
  );
  return {
    ...actual,
    getGuestbookThreadForViewer: mocks.getGuestbookThreadForViewer,
    buildGuestbookMessages: mocks.buildGuestbookMessages,
  };
});

const pageModulePath = "./page";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.notFound.mockImplementation(() => {
    throw new Error("NOT_FOUND");
  });
});

describe("GuestbookThreadPage gb-008", () => {
  it("thirdPartyVisitorReceives404", async () => {
    mocks.auth.mockResolvedValue({
      user: {
        id: "visitor-b",
        role: "VISITOR",
        email: "b@example.com",
        name: "Visitor B",
      },
    });
    const { errors } = await import("@/lib/errors");
    mocks.getGuestbookThreadForViewer.mockRejectedValue(
      errors.notFound("Thread not found"),
    );

    const { default: GuestbookThreadPage } = await import(pageModulePath);

    await expect(
      GuestbookThreadPage({
        params: Promise.resolve({ threadId: "thread-a" }),
      }),
    ).rejects.toThrow("NOT_FOUND");
  });
});
