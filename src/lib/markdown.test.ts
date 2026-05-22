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

  it("renders GitHub-style alerts as semantic callouts", async () => {
    const md = [
      "> [!NOTE]",
      "> A short note with `code`.",
      "",
      "> [!TIP]",
      "> Prefer small batches.",
      "",
      "> [!IMPORTANT]",
      "> This affects launch readiness.",
      "",
      "> [!WARNING]",
      "> Check backups first.",
      "",
      "> [!CAUTION]",
      "> This can break production.",
    ].join("\n");

    const html = await renderMarkdown(md);

    for (const type of ["note", "tip", "important", "warning", "caution"]) {
      expect(html).toContain(`markdown-alert markdown-alert-${type}`);
      expect(html).toContain(`data-alert-type="${type}"`);
    }
    expect(html).toContain("markdown-alert-title");
    expect(html).toContain("NOTE");
    expect(html).toContain("<code>code</code>");
    expect(html).not.toContain("[!NOTE]");
  });

  it("strips dangerous embedded HTML", async () => {
    const md = 'Hello\n\n<script>alert("xss")</script>\n\nworld';
    const html = await renderMarkdown(md);
    expect(html).not.toContain("<script");
    expect(html).not.toContain("alert(");
  });

  it("keeps sanitize protection inside transformed alerts", async () => {
    const md = [
      "> [!WARNING]",
      "> <img src=x onerror=alert(1)>",
      "> <script>alert('xss')</script>",
    ].join("\n");

    const html = await renderMarkdown(md);

    expect(html).toContain("markdown-alert-warning");
    expect(html).not.toContain("onerror");
    expect(html).not.toContain("<script");
    expect(html).not.toContain("alert(");
  });
});

type MarkdownModule = {
  extractToc: (
    content: string,
  ) => Promise<Array<{ id: string; text: string; level: 2 | 3 }>>;
};

async function loadMarkdownModule(): Promise<MarkdownModule> {
  const modulePath = "./markdown";
  return (await import(modulePath)) as MarkdownModule;
}

function headingIds(html: string): string[] {
  return Array.from(html.matchAll(/<h[23][^>]*id="([^"]+)"/g)).map(
    (match) => match[1],
  );
}

describe("extractToc", () => {
  it("extracts h2/h3 with ids matching renderMarkdown output", async () => {
    const { extractToc } = await loadMarkdownModule();
    const markdown = "## Intro\n### Details\n## Conclusion";

    const toc = await extractToc(markdown);

    expect(toc).toEqual([
      { id: "intro", text: "Intro", level: 2 },
      { id: "details", text: "Details", level: 3 },
      { id: "conclusion", text: "Conclusion", level: 2 },
    ]);
    expect(toc.map((h) => h.id)).toEqual(
      headingIds(await renderMarkdown(markdown)),
    );
  });

  it("skips h1 and h4+", async () => {
    const { extractToc } = await loadMarkdownModule();

    await expect(extractToc("# Top\n## A\n#### Deep")).resolves.toEqual([
      { id: "a", text: "A", level: 2 },
    ]);
  });

  it("returns [] for empty input", async () => {
    const { extractToc } = await loadMarkdownModule();

    await expect(extractToc("")).resolves.toEqual([]);
  });
});
