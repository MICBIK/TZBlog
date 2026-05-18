import { describe, expect, it } from "vitest";
import { renderMarkdown } from "./markdown";

describe("renderMarkdown", () => {
  it("returns empty string for empty input", async () => {
    expect(await renderMarkdown("")).toBe("");
  });

  it("renders a paragraph", async () => {
    const html = await renderMarkdown("Hello **world**.");
    expect(html).toContain("<p>");
    expect(html).toContain("<strong>world</strong>");
  });

  it("emits slug ids on headings", async () => {
    const html = await renderMarkdown("## Hello World");
    // rehype-slug adds id; rehype-autolink-headings (wrap) wraps content in <a>.
    expect(html).toMatch(/<h2[^>]*id="hello-world"/);
    expect(html).toMatch(/<a[^>]*href="#hello-world"[^>]*>[\s\S]*Hello World[\s\S]*<\/a>/);
  });

  it("highlights ts code blocks via shiki", async () => {
    const md = "```ts\nconst x: number = 1;\n```";
    const html = await renderMarkdown(md);
    expect(html).toMatch(/<pre[^>]*class="[^"]*shiki/);
    // Shiki wraps tokens in <span style="color:..."> — assert at least one is present.
    expect(html).toMatch(/<span style="color:/);
  });

  it("renders GFM tables", async () => {
    const md = ["| a | b |", "|---|---|", "| 1 | 2 |"].join("\n");
    const html = await renderMarkdown(md);
    expect(html).toContain("<table>");
    expect(html).toContain("<thead>");
    expect(html).toContain("<th>a</th>");
    expect(html).toContain("<td>1</td>");
  });

  it("strips dangerous embedded HTML", async () => {
    const md = 'Hello\n\n<script>alert("xss")</script>\n\nworld';
    const html = await renderMarkdown(md);
    expect(html).not.toContain("<script");
    expect(html).not.toContain("alert(");
  });
});
