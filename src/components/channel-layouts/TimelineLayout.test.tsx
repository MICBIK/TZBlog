import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TimelineLayout } from "./TimelineLayout";
describe("TimelineLayout", () => {
  it("rendersVerticalTimelineWithDayHeaders", () => {
    render(
      <TimelineLayout
        channelSlug="notes"
        entries={[
          {
            id: "1",
            slug: "a",
            kind: "NOTE",
            publishedAt: new Date("2026-05-01T10:00:00Z"),
            title: "同日一",
            metadata: {},
          },
          {
            id: "2",
            slug: "b",
            kind: "NOTE",
            publishedAt: new Date("2026-05-01T18:00:00Z"),
            title: "同日二",
            metadata: {},
          },
          {
            id: "3",
            slug: "c",
            kind: "NOTE",
            publishedAt: new Date("2026-05-02T08:00:00Z"),
            title: "次日一",
            metadata: {},
          },
        ]}
      />,
    );

    expect(screen.getByTestId("timeline-layout")).toBeInTheDocument();
    expect(screen.getAllByTestId("timeline-day-header")).toHaveLength(2);
    expect(screen.getAllByTestId("timeline-entry")).toHaveLength(3);
  });

  it("noteWithMoodShowsMoodIcon", () => {
    render(
      <TimelineLayout
        channelSlug="notes"
        entries={[
          {
            id: "1",
            slug: "moody",
            kind: "NOTE",
            publishedAt: new Date("2026-05-01T10:00:00Z"),
            title: "有心情",
            metadata: { mood: "curious" },
          },
        ]}
      />,
    );

    expect(screen.getByTestId("timeline-mood-curious")).toBeInTheDocument();
  });
});
