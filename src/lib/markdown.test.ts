import { describe, expect, it, vi } from "vitest";
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

  it("highlighter is configured with light and dark themes", async () => {
    vi.resetModules();
    const createHighlighter = vi.fn(async () => ({
      codeToHast: () => ({ type: "root", children: [] }),
      getLoadedLanguages: () => ["ts"],
    }));
    vi.doMock("shiki", () => ({ createHighlighter }));

    const { renderMarkdown: renderMarkdownWithMock } = await import("./markdown");

    await renderMarkdownWithMock("```ts\nconst x = 1;\n```");

    expect(createHighlighter).toHaveBeenCalledWith(
      expect.objectContaining({
        themes: expect.arrayContaining(["github-light", "github-dark-default"]),
      }),
    );

    vi.doUnmock("shiki");
    vi.resetModules();
  });

  it("reuses highlighter across repeated code block renders", async () => {
    vi.resetModules();
    const createHighlighter = vi.fn(async () => ({
      codeToHast: () => ({ type: "root", children: [] }),
      getLoadedLanguages: () => ["ts"],
    }));
    vi.doMock("shiki", () => ({ createHighlighter }));

    const { renderMarkdown: renderMarkdownWithMock } = await import("./markdown");

    await renderMarkdownWithMock("```ts\nconst x = 1;\n```");
    await renderMarkdownWithMock("```ts\nconst y = 2;\n```");

    expect(createHighlighter).toHaveBeenCalledTimes(1);

    vi.doUnmock("shiki");
    vi.resetModules();
  });

  it("renders large markdown within time budget", async () => {
    const section = [
      "## Section",
      "",
      "> [!NOTE]",
      "> Keep this readable.",
      "",
      "```ts",
      "const value = 1;",
      "```",
      "",
      "| a | b |",
      "|---|---|",
      "| 1 | 2 |",
      "",
      "- item",
      "  - nested",
      "",
    ].join("\n");
    const markdown = Array.from({ length: 25 }, () => section).join("\n");
    const startedAt = performance.now();

    const html = await renderMarkdown(markdown);
    const duration = performance.now() - startedAt;

    expect(html).toContain("markdown-alert-note");
    expect(html).toContain("code-block");
    expect(duration).toBeLessThan(3000);
  });

  it("emits dual-theme markup for code blocks", async () => {
    const md = "```ts\nconst x: number = 1;\n```";
    const html = await renderMarkdown(md);

    expect(html).toContain("--shiki-dark:");
    expect(html.match(/<pre\b/g) ?? []).toHaveLength(1);
  });

  it("wraps shiki pre in code-block figure with data-language", async () => {
    const md = "```ts\nconst x: number = 1;\n```";
    const html = await renderMarkdown(md);

    expect(html).toMatch(
      /<figure class="code-block" data-language="ts">[\s\S]*<figcaption class="code-block-chrome">[\s\S]*<span class="code-block-language">TS<\/span>[\s\S]*<\/figcaption>[\s\S]*<pre\b/,
    );
  });

  it("emits filename span when title meta present", async () => {
    const withTitle = await renderMarkdown(
      '```ts title="src/foo.ts"\nconst x = 1;\n```',
    );
    const withoutTitle = await renderMarkdown("```ts\nconst x = 1;\n```");

    expect(withTitle).toContain(
      '<span class="code-block-filename">src/foo.ts</span>',
    );
    expect(withoutTitle).not.toContain("code-block-filename");
  });

  it("emits copy button stub with data-copy attribute", async () => {
    const html = await renderMarkdown("```ts\nconst x = 1;\n```");

    expect(html).toMatch(
      /<button(?=[^>]*class="code-block-copy")(?=[^>]*data-copy)(?=[^>]*aria-label="复制代码")(?=[^>]*data-state="idle")[^>]*>/,
    );
    expect(html).toContain('class="code-block-copy-icon"');
  });

  it("renders GFM tables", async () => {
    const md = ["| a | b |", "|---|---|", "| 1 | 2 |"].join("\n");
    const html = await renderMarkdown(md);
    expect(html).toContain("<table>");
    expect(html).toContain("<thead>");
    expect(html).toContain("<th>a</th>");
    expect(html).toContain("<td>1</td>");
  });

  it("wraps tables in md-table-scroll div", async () => {
    const md = ["| a | b |", "|---|---|", "| 1 | 2 |"].join("\n");
    const html = await renderMarkdown(md);

    expect(html).toMatch(
      /<div class="md-table-scroll">[\s\S]*<table>[\s\S]*<\/table>[\s\S]*<\/div>/,
    );
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
    expect(html).toContain('class="markdown-alert-label">Note</span>');
    expect(html).toContain("<code>code</code>");
    expect(html).not.toContain("[!NOTE]");
  });

  it("emits markdown-alert aside with title div and icon svg", async () => {
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

    for (const [type, label] of [
      ["note", "Note"],
      ["tip", "Tip"],
      ["important", "Important"],
      ["warning", "Warning"],
      ["caution", "Caution"],
    ] as const) {
      const aside = extractAlertAside(html, type);

      expect(aside).toContain('class="markdown-alert-title"');
      expect(aside).toContain('class="markdown-alert-icon"');
      expect(aside).toContain('aria-hidden="true"');
      expect(aside).toContain(`class="markdown-alert-label">${label}</span>`);
      expect(aside).toContain("<p>");
    }
  });

  it("inlines correct SVG path for each alert type", async () => {
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

    const expected = {
      note: [
        'cx="12"',
        'cy="12"',
        'r="10"',
        'd="M12 16v-4"',
        'd="M12 8h.01"',
      ],
      tip: [
        'd="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"',
        'd="M9 18h6"',
        'd="M10 22h4"',
      ],
      important: [
        'cx="12"',
        'cy="12"',
        'r="10"',
        'x1="12"',
        'x2="12"',
        'y1="8"',
        'y2="12"',
        'x2="12.01"',
      ],
      warning: [
        'd="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"',
        'd="M12 9v4"',
        'd="M12 17h.01"',
      ],
      caution: [
        'd="m15 9-6 6"',
        'd="M2.586 16.726A2 2 0 0 1 2 15.312V8.688a2 2 0 0 1 .586-1.414l4.688-4.688A2 2 0 0 1 8.688 2h6.624a2 2 0 0 1 1.414.586l4.688 4.688A2 2 0 0 1 22 8.688v6.624a2 2 0 0 1-.586 1.414l-4.688 4.688a2 2 0 0 1-1.414.586H8.688a2 2 0 0 1-1.414-.586z"',
        'd="m9 9 6 6"',
      ],
    } as const;

    for (const [type, paths] of Object.entries(expected)) {
      const aside = extractAlertAside(html, type);

      for (const path of paths) {
        expect(aside).toContain(path);
      }
    }
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

function extractAlertAside(html: string, type: string): string {
  const match = html.match(
    new RegExp(
      `<aside[^>]*markdown-alert-${type}[^>]*>[\\s\\S]*?<\\/aside>`,
    ),
  );

  if (!match) {
    throw new Error(`Missing markdown-alert-${type} aside`);
  }

  return match[0];
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
