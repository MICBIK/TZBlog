import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ThreadView } from "./ThreadView";

describe("ThreadView", () => {
  it("rendersFlatMessageList", () => {
    render(
      <ThreadView
        messages={[
          {
            id: "m1",
            authorUserId: "u1",
            authorName: "Visitor",
            content: "hello",
            createdAt: new Date("2026-05-25T10:00:00Z"),
          },
          {
            id: "m2",
            authorUserId: "u2",
            authorName: "Admin",
            content: "reply",
            createdAt: new Date("2026-05-25T11:00:00Z"),
          },
        ]}
      />,
    );

    expect(screen.getByTestId("guestbook-thread-view")).toBeInTheDocument();
    expect(screen.getByText("hello")).toBeInTheDocument();
    expect(screen.getByText("reply")).toBeInTheDocument();
  });
});
