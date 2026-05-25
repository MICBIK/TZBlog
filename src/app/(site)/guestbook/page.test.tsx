import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  getChannelPageBySlug: vi.fn(),
  findVisitorThread: vi.fn(),
  listGuestbookThreadsForAdmin: vi.fn(),
  buildGuestbookMessages: vi.fn(),
  getCurrentLocale: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/i18n", () => ({
  DEFAULT_LOCALE: "zh",
  getCurrentLocale: mocks.getCurrentLocale,
}));
vi.mock("@/lib/services/channels", () => ({
  getChannelPageBySlug: mocks.getChannelPageBySlug,
}));
vi.mock("@/lib/services/guestbook", async () => {
  const actual = await vi.importActual<typeof import("@/lib/services/guestbook")>(
    "@/lib/services/guestbook",
  );
  return {
    ...actual,
    findVisitorThread: mocks.findVisitorThread,
    listGuestbookThreadsForAdmin: mocks.listGuestbookThreadsForAdmin,
    buildGuestbookMessages: mocks.buildGuestbookMessages,
  };
});
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

const pageModulePath = "./page";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getCurrentLocale.mockReturnValue("zh");
  mocks.getChannelPageBySlug.mockResolvedValue({
    slug: "guestbook",
    translations: [{ locale: "zh", name: "留言板", description: "私密留言" }],
  });
  mocks.auth.mockResolvedValue(null);
  mocks.findVisitorThread.mockResolvedValue(null);
  mocks.listGuestbookThreadsForAdmin.mockResolvedValue([]);
  mocks.buildGuestbookMessages.mockReturnValue([]);
});

describe("GuestbookPage", () => {
  it("unauthedSeesLoginForm", async () => {
    const { default: GuestbookPage } = await import(pageModulePath);
    render(await GuestbookPage());

    expect(screen.getByText("邮箱 magic link 登录")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "前往登录" })).toHaveAttribute(
      "href",
      "/login?from=/guestbook",
    );
  });

  it("authedVisitorWithoutThreadSeesStartForm", async () => {
    mocks.auth.mockResolvedValue({
      user: {
        id: "visitor-1",
        role: "VISITOR",
        email: "visitor@example.com",
        name: "Visitor",
      },
    });

    const { default: GuestbookPage } = await import(pageModulePath);
    render(await GuestbookPage());

    expect(screen.getByTestId("guestbook-start-form")).toBeInTheDocument();
    expect(screen.getByTestId("guestbook-empty-state")).toHaveTextContent(
      "暂无历史留言",
    );
  });

  it("authedVisitorWithThreadSeesMessages", async () => {
    mocks.auth.mockResolvedValue({
      user: {
        id: "visitor-1",
        role: "VISITOR",
        email: "visitor@example.com",
        name: "Visitor",
      },
    });
    mocks.findVisitorThread.mockResolvedValue({
      id: "thread-1",
      authorId: "visitor-1",
      body: "hello",
      createdAt: new Date("2026-05-25T10:00:00Z"),
      author: { id: "visitor-1", name: "Visitor", email: "visitor@example.com" },
      comments: [
        {
          id: "c1",
          authorUserId: "admin-1",
          authorName: "Admin",
          content: "welcome back",
          createdAt: new Date("2026-05-25T11:00:00Z"),
        },
      ],
    });
    mocks.buildGuestbookMessages.mockReturnValue([
      {
        id: "opening:thread-1",
        authorUserId: "visitor-1",
        authorName: "Visitor",
        content: "hello",
        createdAt: new Date("2026-05-25T10:00:00Z"),
      },
      {
        id: "c1",
        authorUserId: "admin-1",
        authorName: "Admin",
        content: "welcome back",
        createdAt: new Date("2026-05-25T11:00:00Z"),
      },
    ]);

    const { default: GuestbookPage } = await import(pageModulePath);
    render(await GuestbookPage());

    expect(screen.getByTestId("guestbook-visitor-thread")).toBeInTheDocument();
    expect(screen.getByText("hello")).toBeInTheDocument();
    expect(screen.getByText("welcome back")).toBeInTheDocument();
  });

  it("adminSeesAllVisitorThreads", async () => {
    mocks.auth.mockResolvedValue({
      user: { id: "admin-1", role: "ADMIN", email: "admin@example.com" },
    });
    mocks.listGuestbookThreadsForAdmin.mockResolvedValue([
      {
        id: "thread-1",
        slug: "gb-1",
        body: "first thread",
        createdAt: new Date(),
        updatedAt: new Date(),
        resolved: false,
        author: {
          id: "visitor-1",
          name: "Visitor A",
          email: "a@example.com",
        },
        messageCount: 2,
      },
    ]);

    const { default: GuestbookPage } = await import(pageModulePath);
    render(await GuestbookPage());

    expect(screen.getByTestId("guestbook-admin-list")).toBeInTheDocument();
    expect(screen.getByText("Visitor A")).toBeInTheDocument();
    expect(screen.getByText("first thread")).toBeInTheDocument();
  });
});
