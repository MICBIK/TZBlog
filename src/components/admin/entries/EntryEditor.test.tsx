import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { EntryEditor } from "./EntryEditor";

const mocks = vi.hoisted(() => ({
  fetch: vi.fn(),
  push: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
  vi.stubGlobal("fetch", mocks.fetch);
  mocks.fetch.mockResolvedValue(
    new Response(JSON.stringify({ data: { id: "entry-1" } }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }),
  );
});

describe("EntryEditor", () => {
  it("articleChannelRestrictsKindOptionsOnCreate", () => {
    render(
      <EntryEditor
        channels={[
          {
            id: "channel-articles",
            slug: "articles",
            kind: "ARTICLES",
            name: "文章",
          },
        ]}
        initialChannelId="channel-articles"
      />,
    );

    expect(screen.getByLabelText("条目类型")).toHaveValue("ARTICLE");
    expect(screen.getByRole("option", { name: "ARTICLE" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "NOTE" })).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "QUOTE" })).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "LINK" })).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Milkdown editor content" })).toHaveValue("");
  });

  it("notesChannelOffersNoteQuoteLinkKinds", () => {
    render(
      <EntryEditor
        channels={[
          {
            id: "channel-notes",
            slug: "notes",
            kind: "NOTES",
            name: "笔记",
          },
        ]}
        initialChannelId="channel-notes"
      />,
    );

    expect(screen.getByLabelText("条目类型")).toHaveValue("NOTE");
    expect(screen.getByRole("option", { name: "NOTE" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "QUOTE" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "LINK" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "ARTICLE" })).not.toBeInTheDocument();
  });

  it("articleKindRendersMetadataFields", () => {
    render(
      <EntryEditor
        channels={[
          {
            id: "channel-articles",
            slug: "articles",
            kind: "ARTICLES",
            name: "文章",
          },
        ]}
        initialChannelId="channel-articles"
      />,
    );

    expect(screen.getByLabelText("cover")).toBeInTheDocument();
    expect(screen.getByLabelText("readingMinutes")).toBeInTheDocument();
    expect(screen.getByLabelText("toc")).toBeInTheDocument();
    expect(screen.getByLabelText("ogImage")).toBeInTheDocument();
  });

  it("linkKindRendersMetadataFields", async () => {
    const user = userEvent.setup();

    render(
      <EntryEditor
        channels={[
          {
            id: "channel-notes",
            slug: "notes",
            kind: "NOTES",
            name: "笔记",
          },
        ]}
        initialChannelId="channel-notes"
      />,
    );

    await user.selectOptions(screen.getByLabelText("条目类型"), "LINK");

    expect(screen.getByLabelText("sourceUrl")).toBeInTheDocument();
    expect(screen.getByLabelText("sourceTitle")).toBeInTheDocument();
    expect(screen.getByLabelText("sourceAuthor")).toBeInTheDocument();
    expect(screen.getByLabelText("thumbnail")).toBeInTheDocument();
  });

  it("hotTakeKindRendersMetadataFields", async () => {
    const user = userEvent.setup();

    render(
      <EntryEditor
        channels={[
          {
            id: "channel-stream",
            slug: "stream",
            kind: "STREAM",
            name: "碎片流",
          },
        ]}
        initialChannelId="channel-stream"
      />,
    );

    await user.selectOptions(screen.getByLabelText("条目类型"), "HOT_TAKE");

    expect(screen.getByLabelText("sourcePlatform")).toBeInTheDocument();
    expect(screen.getByLabelText("sourceUrl")).toBeInTheDocument();
    expect(screen.getByLabelText("sourceSnippet")).toBeInTheDocument();
  });

  it("saveDraftPostsNewArticleEntry", async () => {
    const user = userEvent.setup();

    render(
      <EntryEditor
        channels={[
          {
            id: "channel-articles",
            slug: "articles",
            kind: "ARTICLES",
            name: "文章",
          },
        ]}
        initialChannelId="channel-articles"
      />,
    );

    fireEvent.change(screen.getByLabelText("标题"), {
      target: { value: "新条目" },
    });
    fireEvent.change(screen.getByLabelText("slug"), {
      target: { value: "new-entry" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Milkdown editor content" }), {
      target: { value: "正文" },
    });
    await new Promise((resolve) => setTimeout(resolve, 350));
    await user.click(screen.getByRole("button", { name: "保存草稿" }));

    await waitFor(() => {
      expect(mocks.fetch).toHaveBeenCalledTimes(1);
    });
    expect(mocks.fetch).toHaveBeenCalledWith("/api/admin/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: "new-entry",
        channelId: "channel-articles",
        kind: "ARTICLE",
        status: "DRAFT",
        seriesId: null,
        seriesOrder: null,
        metadata: {
          cover: null,
          readingMinutes: undefined,
          toc: true,
          ogImage: null,
        },
        tags: [],
        translations: [
          {
            locale: "zh",
            title: "新条目",
            excerpt: null,
            content: "正文",
          },
        ],
      }),
    });
  });

  it("publishExistingArticlePatchesEntryAndRefreshes", async () => {
    const user = userEvent.setup();

    render(
      <EntryEditor
        mode="edit"
        initial={{
          id: "entry-1",
          slug: "existing-entry",
          channelId: "channel-articles",
          kind: "ARTICLE",
          status: "DRAFT",
          publishedAt: null,
          title: "已有条目",
          excerpt: "旧摘要",
          content: "旧正文",
          tags: [],
          metadata: {
            cover: "/uploads/cover.png",
            readingMinutes: 6,
            toc: true,
            ogImage: null,
          },
        }}
        channels={[
          {
            id: "channel-articles",
            slug: "articles",
            kind: "ARTICLES",
            name: "文章",
          },
        ]}
        initialChannelId="channel-articles"
      />,
    );

    fireEvent.change(screen.getByRole("textbox", { name: "Milkdown editor content" }), {
      target: { value: "更新后的正文" },
    });
    await new Promise((resolve) => setTimeout(resolve, 350));
    await user.click(screen.getByRole("button", { name: "发布" }));

    await waitFor(() => {
      expect(mocks.fetch).toHaveBeenCalledTimes(1);
    });
    expect(mocks.fetch).toHaveBeenCalledWith("/api/admin/entries/entry-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: "existing-entry",
        channelId: "channel-articles",
        kind: "ARTICLE",
        status: "PUBLISHED",
        seriesId: null,
        seriesOrder: null,
        metadata: {
          cover: "/uploads/cover.png",
          readingMinutes: 6,
          toc: true,
          ogImage: null,
        },
        tags: [],
        translations: [
          {
            locale: "zh",
            title: "已有条目",
            excerpt: "旧摘要",
            content: "更新后的正文",
          },
        ],
      }),
    });
    expect(mocks.refresh).toHaveBeenCalledTimes(1);
  });

  it("showsFieldLevelErrorWhenLinkMetadataInvalid", async () => {
    const user = userEvent.setup();
    mocks.fetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          error: {
            code: "VALIDATION_ERROR",
            details: {
              issues: [
                {
                  path: ["data", "sourceUrl"],
                  message: "sourceUrl is required",
                },
              ],
            },
          },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    render(
      <EntryEditor
        channels={[
          {
            id: "channel-notes",
            slug: "notes",
            kind: "NOTES",
            name: "笔记",
          },
        ]}
        initialChannelId="channel-notes"
      />,
    );

    await user.selectOptions(screen.getByLabelText("条目类型"), "LINK");
    fireEvent.change(screen.getByLabelText("标题"), {
      target: { value: "链接条目" },
    });
    fireEvent.change(screen.getByLabelText("slug"), {
      target: { value: "link-entry" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Milkdown editor content" }), {
      target: { value: "正文" },
    });
    await new Promise((resolve) => setTimeout(resolve, 350));
    await user.click(screen.getByRole("button", { name: "保存草稿" }));

    await waitFor(() => {
      expect(screen.getByText("sourceUrl is required")).toBeInTheDocument();
    });
  });

  it("showsSlugConflictMessageWhenBackendReturns409", async () => {
    const user = userEvent.setup();
    mocks.fetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          error: {
            code: "CONFLICT",
          },
        }),
        {
          status: 409,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    render(
      <EntryEditor
        channels={[
          {
            id: "channel-articles",
            slug: "articles",
            kind: "ARTICLES",
            name: "文章",
          },
        ]}
        initialChannelId="channel-articles"
      />,
    );

    fireEvent.change(screen.getByLabelText("标题"), {
      target: { value: "冲突条目" },
    });
    fireEvent.change(screen.getByLabelText("slug"), {
      target: { value: "existing-entry" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Milkdown editor content" }), {
      target: { value: "正文" },
    });
    await new Promise((resolve) => setTimeout(resolve, 350));
    await user.click(screen.getByRole("button", { name: "保存草稿" }));

    await waitFor(() => {
      expect(screen.getByText("slug 已被使用")).toBeInTheDocument();
    });
  });

  it("modSPreservesCurrentStatusWhenAutosaving", async () => {
    render(
      <EntryEditor
        mode="edit"
        initial={{
          id: "entry-1",
          slug: "existing-entry",
          channelId: "channel-articles",
          kind: "ARTICLE",
          status: "PUBLISHED",
          publishedAt: "2026-05-25T12:00:00.000Z",
          title: "已发布条目",
          excerpt: "旧摘要",
          content: "旧正文",
          tags: [],
          metadata: {
            cover: "/uploads/cover.png",
            readingMinutes: 6,
            toc: true,
            ogImage: null,
          },
        }}
        channels={[
          {
            id: "channel-articles",
            slug: "articles",
            kind: "ARTICLES",
            name: "文章",
          },
        ]}
        initialChannelId="channel-articles"
      />,
    );

    fireEvent.change(screen.getByRole("textbox", { name: "Milkdown editor content" }), {
      target: { value: "快捷保存后的正文" },
    });
    await new Promise((resolve) => setTimeout(resolve, 350));
    fireEvent.keyDown(screen.getByRole("textbox", { name: "Milkdown editor content" }), {
      key: "s",
      code: "KeyS",
      metaKey: true,
    });

    await waitFor(() => {
      expect(mocks.fetch).toHaveBeenCalledTimes(1);
    });
    const [, init] = mocks.fetch.mock.calls[0];
    expect(JSON.parse(init.body as string).status).toBe("PUBLISHED");
  });

  it("includesSeriesSelectionInSubmitPayload", async () => {
    const user = userEvent.setup();

    render(
      <EntryEditor
        channels={[
          {
            id: "channel-articles",
            slug: "articles",
            kind: "ARTICLES",
            name: "文章",
          },
        ]}
        seriesOptions={[
          {
            id: "series-1",
            channelId: "channel-articles",
            name: "系列一",
          },
        ]}
        initialChannelId="channel-articles"
      />,
    );

    fireEvent.change(screen.getByLabelText("标题"), {
      target: { value: "系列条目" },
    });
    fireEvent.change(screen.getByLabelText("slug"), {
      target: { value: "series-entry" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Milkdown editor content" }), {
      target: { value: "正文" },
    });
    await new Promise((resolve) => setTimeout(resolve, 350));
    await user.selectOptions(screen.getByLabelText("seriesId"), "series-1");
    fireEvent.change(screen.getByLabelText("seriesOrder"), {
      target: { value: "2" },
    });
    await user.click(screen.getByRole("button", { name: "保存草稿" }));

    await waitFor(() => {
      expect(mocks.fetch).toHaveBeenCalledTimes(1);
    });
    const [, init] = mocks.fetch.mock.calls[0];
    const body = JSON.parse(init.body as string);
    expect(body.seriesId).toBe("series-1");
    expect(body.seriesOrder).toBe(2);
  });

  it("includesSelectedTagsInSubmitPayload", async () => {
    const user = userEvent.setup();

    render(
      <EntryEditor
        channels={[
          {
            id: "channel-articles",
            slug: "articles",
            kind: "ARTICLES",
            name: "文章",
          },
        ]}
        allTags={[
          {
            slug: "next-js",
            name: "Next.js",
          },
        ]}
        initialChannelId="channel-articles"
      />,
    );

    fireEvent.change(screen.getByLabelText("标题"), {
      target: { value: "标签条目" },
    });
    fireEvent.change(screen.getByLabelText("slug"), {
      target: { value: "tagged-entry" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Milkdown editor content" }), {
      target: { value: "正文" },
    });
    await new Promise((resolve) => setTimeout(resolve, 350));
    await user.type(screen.getByPlaceholderText("输入标签..."), "next-js{enter}");
    await user.click(screen.getByRole("button", { name: "保存草稿" }));

    await waitFor(() => {
      expect(mocks.fetch).toHaveBeenCalledTimes(1);
    });
    const [, init] = mocks.fetch.mock.calls[0];
    const body = JSON.parse(init.body as string);
    expect(body.tags).toEqual(["next-js"]);
  });

  it("archivesPublishedArticleFromEditMode", async () => {
    const user = userEvent.setup();

    render(
      <EntryEditor
        mode="edit"
        initial={{
          id: "entry-1",
          slug: "published-entry",
          channelId: "channel-articles",
          kind: "ARTICLE",
          status: "PUBLISHED",
          publishedAt: "2026-05-25T12:00:00.000Z",
          title: "已发布条目",
          excerpt: "摘要",
          content: "正文",
          tags: [],
          metadata: {
            cover: null,
            readingMinutes: 5,
            toc: true,
            ogImage: null,
          },
        }}
        channels={[
          {
            id: "channel-articles",
            slug: "articles",
            kind: "ARTICLES",
            name: "文章",
          },
        ]}
        initialChannelId="channel-articles"
      />,
    );

    expect(screen.getByRole("button", { name: "归档" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "归档" }));

    await waitFor(() => {
      expect(mocks.fetch).toHaveBeenCalledTimes(1);
    });
    const [, init] = mocks.fetch.mock.calls[0];
    expect(JSON.parse(init.body as string).status).toBe("ARCHIVED");
    expect(mocks.refresh).toHaveBeenCalledTimes(1);
  });
});
