import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import { visit } from "unist-util-visit";
import { toString as hastToString } from "hast-util-to-string";
import { createHighlighter, type Highlighter, type BundledLanguage, type BundledTheme } from "shiki";

// Local minimal hast shapes — `@types/hast` is not a direct dep, and we only
// need the few fields that show up in the visitor.
interface HastElement {
  type: "element";
  tagName: string;
  properties?: Record<string, unknown>;
  children: HastNode[];
}
interface HastText {
  type: "text";
  value: string;
}
type HastNode = HastElement | HastText | { type: string; [k: string]: unknown };
interface HastRoot {
  type: "root";
  children: HastNode[];
}

type MarkdownAlertType = "NOTE" | "TIP" | "IMPORTANT" | "WARNING" | "CAUTION";

export type TocHeading = {
  id: string;
  text: string;
  level: 2 | 3;
};

/**
 * Markdown rendering pipeline (per systemPatterns §13).
 *
 * remark-parse → remark-gfm → remark-rehype → rehype-slug
 * → rehype-autolink-headings → rehype-sanitize → rehype-shiki → rehype-stringify
 *
 * Note: `rehype-sanitize` runs *before* shiki because shiki injects `style` attrs
 * on tokens that the default sanitize schema strips. We extend the schema to
 * allow shiki's safe `style`, `class`, and `tabindex` markup so highlighted
 * output survives sanitization. Sanitize stays in the pipeline as a hard wall
 * against user-supplied raw HTML (XSS).
 */

const DEFAULT_THEME: BundledTheme = "github-dark-default";

const DEFAULT_LANGS: BundledLanguage[] = [
  "typescript",
  "tsx",
  "javascript",
  "json",
  "bash",
  "css",
  "html",
  "sql",
  "yaml",
  "markdown",
];

// Lazily created and shared singleton — shiki highlighter init is expensive.
const highlighterCache = new Map<string, Promise<Highlighter>>();

function getHighlighter(theme: BundledTheme): Promise<Highlighter> {
  const cached = highlighterCache.get(theme);
  if (cached) return cached;
  const created = createHighlighter({
    themes: [theme],
    langs: DEFAULT_LANGS,
  });
  highlighterCache.set(theme, created);
  return created;
}

interface RehypeShikiOptions {
  theme: BundledTheme;
}

/**
 * Inline rehype plugin: syntax-highlight `<pre><code class="language-x">...</code></pre>`
 * blocks via shiki v4. The packaged `rehype-shiki@0.0.9` is incompatible with
 * shiki v4's API, so we implement the visitor here.
 *
 * Typed as a plain transformer factory (no `unified.Plugin<...>` wrapping) so
 * that strict tsc keeps the broader `unified()` chain happy across versions.
 */
function rehypeShiki(options: RehypeShikiOptions) {
  const { theme } = options;
  return async (tree: HastRoot) => {
    const highlighter = await getHighlighter(theme);
    const loadedLangs = new Set(highlighter.getLoadedLanguages());

    const codeBlocks: Array<{ parent: HastElement; lang: string | null; code: string }> = [];

    visit(tree as never, "element", (node: unknown, _index: number | undefined, parent: unknown) => {
      const el = node as HastElement;
      const par = parent as HastElement | null;
      if (
        el.tagName !== "code" ||
        !par ||
        par.type !== "element" ||
        par.tagName !== "pre"
      ) {
        return;
      }
      codeBlocks.push({
        parent: par,
        lang: codeLanguage(el),
        code: hastToString(el as never),
      });
    });

    for (const { parent, lang, code } of codeBlocks) {
      const useLang = lang && loadedLangs.has(lang) ? lang : "text";
      try {
        const hast = highlighter.codeToHast(code, {
          lang: useLang,
          theme,
        }) as unknown as HastRoot;
        // codeToHast returns a root containing the <pre> element. Replace the
        // current <pre> in-place with shiki's <pre>.
        const shikiPre = hast.children.find(
          (c): c is HastElement => (c as HastElement).type === "element" && (c as HastElement).tagName === "pre",
        );
        if (shikiPre) {
          parent.tagName = shikiPre.tagName;
          parent.properties = { ...(shikiPre.properties ?? {}) };
          parent.children = shikiPre.children;
        }
      } catch {
        // Fall through and leave the node untouched on failure.
      }
    }
  };
}

function codeLanguage(node: HastElement): string | null {
  const className = (node.properties?.className ?? []) as Array<unknown>;
  for (const c of className) {
    if (typeof c === "string" && c.startsWith("language-")) {
      return c.slice("language-".length);
    }
  }
  return null;
}

function rehypeCollectToc(headings: TocHeading[]) {
  return (tree: HastRoot) => {
    visit(tree as never, "element", (node: unknown) => {
      const el = node as HastElement;
      if (el.tagName !== "h2" && el.tagName !== "h3") return;

      const id = el.properties?.id;
      if (typeof id !== "string" || !id) return;

      headings.push({
        id,
        text: hastToString(el as never),
        level: el.tagName === "h2" ? 2 : 3,
      });
    });
  };
}

function rehypeMarkdownAlerts() {
  return (tree: HastRoot) => {
    visit(tree as never, "element", (node: unknown) => {
      const el = node as HastElement;
      if (el.tagName !== "blockquote") return;

      const match = extractAlertMarker(el);
      if (!match) return;

      const type = match.type.toLowerCase();
      el.tagName = "aside";
      el.properties = {
        ...(el.properties ?? {}),
        className: ["markdown-alert", `markdown-alert-${type}`],
        dataAlertType: type,
        role: "note",
      };
      el.children = [
        {
          type: "element",
          tagName: "div",
          properties: { className: ["markdown-alert-title"] },
          children: [{ type: "text", value: match.type }],
        },
        ...el.children,
      ];
    });
  };
}

function extractAlertMarker(
  blockquote: HastElement,
): { type: MarkdownAlertType } | null {
  const firstParagraph = blockquote.children.find(
    (child): child is HastElement =>
      (child as HastElement).type === "element" &&
      (child as HastElement).tagName === "p",
  );
  if (!firstParagraph) return null;

  const firstText = firstParagraph.children.find(
    (child): child is HastText => (child as HastText).type === "text",
  );
  if (!firstText) return null;

  const marker = /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\](?:\s*\n\s*|\s+|$)/.exec(
    firstText.value,
  );
  if (!marker) return null;

  const type = marker[1] as MarkdownAlertType;
  firstText.value = firstText.value.slice(marker[0].length);

  if (
    firstText.value === "" &&
    firstParagraph.children.every(
      (child) => child === firstText || hastToString(child as never) === "",
    )
  ) {
    blockquote.children = blockquote.children.filter(
      (child) => child !== firstParagraph,
    );
  }

  return { type };
}

// Sanitize schema extension — allow attributes shiki and our anchor plugins emit.
// `clobberPrefix: ""` disables the default `user-content-` id rewrite so heading
// slugs stay aligned with the autolink hrefs emitted by `rehype-autolink-headings`.
const sanitizeSchema = {
  ...defaultSchema,
  clobberPrefix: "",
  tagNames: [...(defaultSchema.tagNames ?? []), "aside"],
  attributes: {
    ...(defaultSchema.attributes ?? {}),
    "*": [
      ...((defaultSchema.attributes?.["*"] ?? []) as unknown as string[]),
      "className",
      "style",
      "tabIndex",
    ],
    code: [
      ...((defaultSchema.attributes?.code ?? []) as unknown as string[]),
      "className",
      "style",
    ],
    span: [
      ...((defaultSchema.attributes?.span ?? []) as unknown as string[]),
      "className",
      "style",
    ],
    pre: [
      ...((defaultSchema.attributes?.pre ?? []) as unknown as string[]),
      "className",
      "style",
      "tabIndex",
    ],
    div: [
      ...((defaultSchema.attributes?.div ?? []) as unknown as string[]),
      "className",
    ],
    aside: [
      ...((defaultSchema.attributes?.blockquote ?? []) as unknown as string[]),
      "className",
      "dataAlertType",
      "role",
    ],
    a: [
      ...((defaultSchema.attributes?.a ?? []) as unknown as string[]),
      "ariaHidden",
      "ariaLabel",
      "tabIndex",
    ],
  },
} as typeof defaultSchema;

export interface RenderMarkdownOptions {
  theme?: BundledTheme;
}

/**
 * Render Markdown content to a sanitized HTML string with syntax highlighting.
 *
 * Empty input short-circuits to an empty string so callers (e.g. previews)
 * don't pay the highlighter init cost on first paint.
 */
export async function renderMarkdown(
  content: string,
  opts: RenderMarkdownOptions = {},
): Promise<string> {
  if (!content) return "";
  const theme = opts.theme ?? DEFAULT_THEME;
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: false })
    .use(rehypeMarkdownAlerts)
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings, { behavior: "wrap" })
    .use(rehypeSanitize, sanitizeSchema)
    .use(rehypeShiki, { theme })
    .use(rehypeStringify)
    .process(content);
  return String(file);
}

export async function extractToc(content: string): Promise<TocHeading[]> {
  if (!content) return [];

  const headings: TocHeading[] = [];
  await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: false })
    .use(rehypeSlug)
    .use(rehypeCollectToc, headings)
    .use(rehypeStringify)
    .process(content);

  return headings;
}
