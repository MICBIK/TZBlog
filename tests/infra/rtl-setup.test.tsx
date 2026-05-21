import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("RTL infra", () => {
  it("renders", () => {
    render(<div>hello</div>);
    expect(screen.getByText("hello")).toBeInTheDocument();
  });
});
