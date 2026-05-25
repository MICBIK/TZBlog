import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EntryEditor } from "./EntryEditor";

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
});
